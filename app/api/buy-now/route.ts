import { NextResponse } from "next/server";
import { createCart } from "@/lib/shopify";

export async function POST(req: Request) {
  const { variantId, quantity } = await req.json();
  const cart = await createCart(variantId, quantity ?? 1);
  return NextResponse.json({ checkoutUrl: cart.checkoutUrl });
}
