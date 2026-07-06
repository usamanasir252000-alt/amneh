import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { createCart, linkCartToCustomer, setCartAttributes, CartBuyerIdentityInput } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const startedAt = Date.now();
  const { variantId, quantity } = await req.json();
  console.log("[buy-now] received:", JSON.stringify({ variantId, quantity }));

  let cart;
  try {
    cart = await createCart(variantId, quantity ?? 1);
  } catch (err) {
    console.error("[buy-now] createCart failed:", JSON.stringify({ variantId, quantity, elapsedMs: Date.now() - startedAt, error: (err as Error)?.message }));
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

  // Meta attribution tagging never affects which checkoutUrl to send the
  // buyer to, so it must never block the redirect — fire it and move on.
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
  })();

  // Only logged-in buyers need the extra round-trip: it swaps in the
  // authenticated checkoutUrl so they land on checkout already signed in.
  // Anonymous buyers (most ad traffic) skip it and redirect immediately.
  let checkoutUrl = cart.checkoutUrl;
  if (sessionToken) {
    try {
      const payload = await verifyToken(sessionToken);
      // Pass ONLY the token when present — adding `email` alongside it makes
      // Shopify treat the buyer as a guest and breaks logged-in checkout.
      const buyerIdentity: CartBuyerIdentityInput | null = payload.shopifyToken
        ? { customerAccessToken: payload.shopifyToken as string }
        : payload.email
        ? { email: payload.email as string }
        : null;
      if (buyerIdentity) {
        const linked = await linkCartToCustomer(cart.id, buyerIdentity, buyerIp);
        checkoutUrl = linked.checkoutUrl || cart.checkoutUrl;
      }
    } catch {
      // Fall back to the guest checkoutUrl already set above.
    }
  }

  console.log("[buy-now] success:", JSON.stringify({ variantId, cartId: cart.id, elapsedMs: Date.now() - startedAt }));
  return NextResponse.json({ checkoutUrl });
}
