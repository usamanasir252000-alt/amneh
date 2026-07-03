import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { createCart, linkCartToCustomer, setCartAttributes, CartBuyerIdentityInput } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { variantId, quantity } = await req.json();

  let cart;
  try {
    cart = await createCart(variantId, quantity ?? 1);
  } catch (err) {
    console.error("[buy-now] createCart failed:", err);
    return NextResponse.json({ error: "Could not create cart" }, { status: 502 });
  }

  // Buyer's real IP — required by Shopify to carry the logged-in session into
  // checkout on server-side calls (see Shopify-Storefront-Buyer-IP header).
  const buyerIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    undefined;

  const cookieStore = await cookies();
  const ua = req.headers.get("user-agent") || undefined;
  const sessionToken = cookieStore.get("session")?.value;

  // Attribution tagging and customer-linking are independent of each other —
  // both only need cart.id — so run them concurrently instead of sequentially.
  // Neither is fatal to checkout, so failures/timeouts here just fall back to
  // the base cart.checkoutUrl instead of blocking the redirect.
  const [, checkoutUrl] = await Promise.all([
    (async () => {
      try {
        const attrs: { key: string; value: string }[] = [];
        const fbp = cookieStore.get("_fbp")?.value;
        const fbc = cookieStore.get("_fbc")?.value;
        if (fbp) attrs.push({ key: "_fbp", value: fbp });
        if (fbc) attrs.push({ key: "_fbc", value: fbc });
        if (buyerIp) attrs.push({ key: "_fb_ip", value: buyerIp });
        if (ua) attrs.push({ key: "_fb_ua", value: ua });
        if (attrs.length) await setCartAttributes(cart.id, attrs);
      } catch (err) {
        console.error("[meta attrs] failed to store on cart (buy-now):", err);
      }
    })(),
    (async () => {
      // Link to the logged-in customer so checkout shows them signed in.
      try {
        if (!sessionToken) return cart.checkoutUrl;
        const payload = await verifyToken(sessionToken);
        // Pass ONLY the token when present — adding `email` alongside it makes
        // Shopify treat the buyer as a guest and breaks logged-in checkout.
        const buyerIdentity: CartBuyerIdentityInput | null = payload.shopifyToken
          ? { customerAccessToken: payload.shopifyToken as string }
          : payload.email
          ? { email: payload.email as string }
          : null;
        if (!buyerIdentity) return cart.checkoutUrl;
        const linked = await linkCartToCustomer(cart.id, buyerIdentity, buyerIp);
        // Prefer the authenticated checkout URL returned under the buyer IP.
        return linked.checkoutUrl || cart.checkoutUrl;
      } catch {
        return cart.checkoutUrl;
      }
    })(),
  ]);

  return NextResponse.json({ checkoutUrl });
}
