import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { createCart, linkCartToCustomer } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { variantId, quantity } = await req.json();
  const cart = await createCart(variantId, quantity ?? 1);

  // Link to the logged-in customer so checkout is pre-filled.
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    if (sessionToken) {
      const payload = await verifyToken(sessionToken);
      const buyerIdentity = payload.shopifyToken
        ? { customerAccessToken: payload.shopifyToken as string }
        : payload.email
        ? { email: payload.email as string }
        : null;
      if (buyerIdentity) await linkCartToCustomer(cart.id, buyerIdentity);
    }
  } catch {
    // non-fatal
  }

  return NextResponse.json({ checkoutUrl: cart.checkoutUrl });
}
