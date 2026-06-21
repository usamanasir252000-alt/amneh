import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { createCart, linkCartToCustomer, CartBuyerIdentityInput } from "@/lib/shopify";

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
