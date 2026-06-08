import { NextResponse } from "next/server";
import { getProducts } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;

  try {
    const products = await getProducts(category);
    return NextResponse.json(products);
  } catch (error) {
    console.error("Shopify products fetch error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
