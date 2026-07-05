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

    console.log('[ProductAPI] handle:', id);
    console.log('[ProductAPI] description:', product?.description ?? 'NULL');
    console.log('[ProductAPI] ingredients:', product?.ingredients ?? 'NULL');
    console.log('[ProductAPI] howToUse:', product?.howToUse ?? 'NULL');

    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(product);
  } catch (error) {
    // Shopify failed/timed out — this is NOT the same as "product doesn't exist".
    // Return 503 so the client shows a retry instead of a false "not found".
    console.error('[ProductAPI] error:', error);
    return NextResponse.json({ error: "Upstream error" }, { status: 503 });
  }
}
