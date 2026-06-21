import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import {
  createCart,
  addCartLine,
  updateCartLine,
  removeCartLine,
  fetchCart,
  linkCartToCustomer,
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
  const body = await request.json();
  const { action, cartId, variantId, lineId, quantity } = body as {
    action: "create" | "add" | "update" | "remove" | "link";
    cartId?: string;
    variantId?: string;
    lineId?: string;
    quantity?: number;
  };

  // Associate the cart with the logged-in customer so Shopify checkout shows
  // them as signed in and pre-fills their details. Uses the customer access
  // token when available (full sign-in), otherwise falls back to email.
  async function linkCurrentCustomer(id: string) {
    try {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("session")?.value;
      if (!sessionToken) {
        console.log("[cart link] no session cookie — user not logged in");
        return;
      }
      const payload = await verifyToken(sessionToken);
      console.log("[cart link] session:", {
        email: payload.email,
        hasShopifyToken: !!payload.shopifyToken,
      });
      const buyerIdentity = payload.shopifyToken
        ? { customerAccessToken: payload.shopifyToken as string }
        : payload.email
        ? { email: payload.email as string }
        : null;
      if (buyerIdentity) await linkCartToCustomer(id, buyerIdentity);
    } catch {
      // non-fatal — cart still works without linking
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
        await linkCurrentCustomer(cartId);
        return NextResponse.json({ ok: true });
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
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
