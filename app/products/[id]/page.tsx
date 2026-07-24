import { notFound } from "next/navigation";
import { getProductByHandle, getProducts } from "@/lib/shopify";
import ProductClient from "./ProductClient";

// ISR: the rendered page is cached and served instantly, refreshed in the
// background at most every 2 minutes. This replaced force-dynamic — rendering
// fresh per request meant every product click paid two live Shopify
// round-trips before the browser saw a single byte, which is why navigation
// felt slow. The HTML-first benefit is unchanged (price/details are still in
// the initial HTML for in-app browsers that never run JS); the data is at most
// ~2 min stale, and checkout always validates live prices/stock on Shopify.
// ISR also makes <Link> prefetch effective: product pages are fetched while
// the shopper is still looking at the grid, so the click is instant.
export const revalidate = 120;

// Prebuild every product page at deploy so even the first visitor after a
// release gets the cached version. New products added later still work —
// they're rendered on demand on first hit, then cached (dynamicParams).
export async function generateStaticParams() {
  const products = await getProducts().catch(() => []);
  return products.filter((p) => p.handle).map((p) => ({ id: p.handle }));
}

export default async function ProductPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fire both Shopify round-trips CONCURRENTLY. The "Most Loved" catalog fetch
  // does not depend on the product, so awaiting it after getProductByHandle
  // just stacked two serial latencies into TTFB — on a slow mobile connection
  // that delay is enough for an ad click to bounce before the page paints.
  // Running them in parallel makes TTFB one round-trip instead of two.
  const [product, allProducts] = await Promise.all([
    getProductByHandle(id),
    getProducts().catch(() => []),
  ]);

  if (!product) notFound();

  // "Most Loved" rail at the bottom of the page — same category, current
  // product excluded, capped well above what we'll ever show so a short
  // catalog doesn't leave the section looking sparse.
  // NOTE: getProducts(category) filters on Shopify TAGS, but `product.category`
  // is derived from productType — the two aren't the same value, so we fetch
  // unfiltered and match on `category` ourselves instead of passing it through.
  const relatedProducts = allProducts
    .filter((p) => p.handle && p.handle !== product.handle && p.category === product.category)
    .slice(0, 8);

  return <ProductClient product={product} relatedProducts={relatedProducts} />;
}
