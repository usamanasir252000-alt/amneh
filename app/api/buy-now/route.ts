import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { createCart, linkCartToCustomer, setCartAttributes, CartBuyerIdentityInput } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { variantId, quantity } = await req.json();
  const cart = await createCart(variantId, quantity ?? 1);

  // Buyer's real IP — required by Shopify to carry the logged-in session into
  // checkout on server-side calls (see Shopify-Storefront-Buyer-IP header).
  const buyerIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    undefined;

  // Stash Meta attribution (_fbp/_fbc cookies + IP/UA) on the cart so the
  // WhatsApp-confirmed Purchase can match back to the ad click.
  try {
    const cookieStore = await cookies();
    const ua = req.headers.get("user-agent") || undefined;
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

  // Link to the logged-in customer so checkout shows them signed in.
  let checkoutUrl = cart.checkoutUrl;
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    if (sessionToken) {
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
        // Prefer the authenticated checkout URL returned under the buyer IP.
        if (linked.checkoutUrl) checkoutUrl = linked.checkoutUrl;
      }
    }
  } catch {
    // non-fatal
  }

  return NextResponse.json({ checkoutUrl });
}
