import { notFound } from "next/navigation";
import { getProductByHandle, getProducts } from "@/lib/shopify";
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

  // "Most Loved" rail at the bottom of the page — same category, current
  // product excluded, capped well above what we'll ever show so a short
  // catalog doesn't leave the section looking sparse.
  // NOTE: getProducts(category) filters on Shopify TAGS, but `product.category`
  // is derived from productType — the two aren't the same value, so we fetch
  // unfiltered and match on `category` ourselves instead of passing it through.
  const allProducts = await getProducts().catch(() => []);
  const relatedProducts = allProducts
    .filter((p) => p.handle !== product.handle && p.category === product.category)
    .slice(0, 8);

  return <ProductClient product={product} relatedProducts={relatedProducts} />;
}
