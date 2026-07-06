import { NextResponse, after } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import {
  createCart,
  addCartLine,
  updateCartLine,
  removeCartLine,
  fetchCart,
  linkCartToCustomer,
  setCartAttributes,
  CartBuyerIdentityInput,
} from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cartId = searchParams.get("cartId");

  if (!cartId) {
    return NextResponse.json({ error: "Missing cartId" }, { status: 400 });
  }

  try {
    const cart = await fetchCart(cartId);
    if (!cart) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(cart);
  } catch {
    return NextResponse.json(null, { status: 404 });
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const body = await request.json();
  const { action, cartId, variantId, lineId, quantity } = body as {
    action: "create" | "add" | "update" | "remove" | "link";
    cartId?: string;
    variantId?: string;
    lineId?: string;
    quantity?: number;
  };
  console.log("[cart] received:", JSON.stringify({ action, cartId, variantId, lineId, quantity }));

  // The buyer's real IP. Shopify requires the Shopify-Storefront-Buyer-IP
  // header on server-side calls to carry a logged-in customer's session into
  // checkout — without it the customer is associated but checkout shows "Sign in".
  const buyerIp =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    undefined;

  // Associate the cart with the logged-in customer so Shopify checkout shows
  // them as signed in and pre-fills their details. Returns the fresh checkout
  // URL produced under the authenticated buyer identity.
  async function linkCurrentCustomer(id: string): Promise<string | null> {
    try {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("session")?.value;
      if (!sessionToken) {
        console.log("[cart link] no session cookie — user not logged in");
        return null;
      }
      const payload = await verifyToken(sessionToken);
      console.log("[cart link] session:", {
        email: payload.email,
        hasShopifyToken: !!payload.shopifyToken,
        hasBuyerIp: !!buyerIp,
      });

      // IMPORTANT: when we have a customer access token, pass ONLY the token.
      // Sending `email` alongside it makes Shopify treat the buyer as a guest
      // with that email instead of the authenticated customer, which breaks the
      // logged-in checkout (shows "Sign in"). Email-only is the fallback for
      // sessions without a Shopify token.
      const buyerIdentity: CartBuyerIdentityInput | null = payload.shopifyToken
        ? { customerAccessToken: payload.shopifyToken as string }
        : payload.email
        ? { email: payload.email as string }
        : null;

      if (!buyerIdentity) return null;
      const { checkoutUrl } = await linkCartToCustomer(id, buyerIdentity, buyerIp);
      return checkoutUrl;
    } catch {
      // non-fatal — cart still works without linking
      return null;
    }
  }

  // Stash Meta attribution data on the cart (persists to the order) so the
  // WhatsApp-confirmed Purchase can match back to the ad click. _fbp/_fbc are
  // first-party cookies sent with this same-origin request; IP/UA come from
  // this (customer-originated) request's headers.
  async function storeMetaAttributes(id: string) {
    try {
      const cookieStore = await cookies();
      const ua = request.headers.get("user-agent") || undefined;
      const attrs: { key: string; value: string }[] = [];
      const fbp = cookieStore.get("_fbp")?.value;
      const fbc = cookieStore.get("_fbc")?.value;
      if (fbp) attrs.push({ key: "_fbp", value: fbp });
      if (fbc) attrs.push({ key: "_fbc", value: fbc });
      if (buyerIp) attrs.push({ key: "_fb_ip", value: buyerIp });
      if (ua) attrs.push({ key: "_fb_ua", value: ua });
      if (attrs.length) await setCartAttributes(id, attrs);
    } catch (err) {
      console.error("[meta attrs] failed to store on cart:", err);
    }
  }

  try {
    switch (action) {
      case "create": {
        if (!variantId) throw new Error("variantId required");
        const cart = await createCart(variantId, quantity ?? 1);
        await linkCurrentCustomer(cart.id);
        return NextResponse.json(cart);
      }

      case "link": {
        if (!cartId) throw new Error("cartId required");
        // Meta attribution never affects checkoutUrl, so it must never block
        // the redirect. Scheduled via after() — NOT a bare fire-and-forget
        // promise — because Vercel can freeze/kill the function the instant
        // the response is sent, aborting any in-flight fetch that isn't
        // explicitly kept alive.
        after(() => storeMetaAttributes(cartId));
        const checkoutUrl = await linkCurrentCustomer(cartId);
        return NextResponse.json({ ok: true, checkoutUrl });
      }

      case "add":
        if (!cartId || !variantId) throw new Error("cartId and variantId required");
        return NextResponse.json(await addCartLine(cartId, variantId, quantity ?? 1));

      case "update":
        if (!cartId || !lineId || quantity === undefined)
          throw new Error("cartId, lineId, and quantity required");
        return NextResponse.json(await updateCartLine(cartId, lineId, quantity));

      case "remove":
        if (!cartId || !lineId) throw new Error("cartId and lineId required");
        return NextResponse.json(await removeCartLine(cartId, lineId));

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[cart] failed:", JSON.stringify({ action, cartId, variantId, elapsedMs: Date.now() - startedAt, error: (error as Error)?.message }));
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    console.log("[cart] completed:", JSON.stringify({ action, cartId, elapsedMs: Date.now() - startedAt }));
  }
}
