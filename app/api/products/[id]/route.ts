import { NextResponse } from "next/server";
import { getProductByHandle } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const product = await getProductByHandle(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Shopify product fetch error:", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
