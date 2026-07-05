import { notFound } from "next/navigation";
import { getProductByHandle } from "@/lib/shopify";
import ProductClient from "./ProductClient";

// Fetch fresh from Shopify on EVERY request — same as the old client-side
// fetch, just executed server-side so the price/details are already in the
// HTML the browser receives. Data is exactly as live as before; only WHERE
// the fetch happens changed. This is what makes the page work even when a
// customer's JS never finishes loading/hydrating (slow connection, in-app
// browser) — the price and details are visible immediately regardless.
export const dynamic = "force-dynamic";

export default async function ProductPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await getProductByHandle(id);

  if (!product) notFound();

  return <ProductClient product={product} />;
}
