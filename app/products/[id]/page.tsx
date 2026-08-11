import { notFound } from "next/navigation";
import { getProductByHandle, getProducts, type ShopifyProduct } from "@/lib/shopify";
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

  return (
    <ProductClient
      product={product}
      relatedProducts={relatedProducts}
      bundleResults={buildBundleResults(product, allProducts)}
    />
  );
}

// ── Before/after for each product inside a bundle ──────────────────────────
// A bundle has no before/after of its own — the proof lives on the individual
// serums. Membership comes from the bundle's own `custom.bundle_ingredients`
// metafield (the same one that drives the ingredient lists): one line per
// product, "Product Name | ingredients", so the name before the pipe is the
// member. We match those names against the catalog by title and carry each
// member's before/after through. If the metafield is missing or nothing
// matches (e.g. a name was retyped and no longer matches a product title),
// fall back to every non-bundle product that has a before/after — better to
// show the proof in a slightly different order than to show none at all.
function buildBundleResults(
  product: ShopifyProduct,
  allProducts: ShopifyProduct[],
): { name: string; beforeUrl: string; afterUrl: string }[] {
  if (!product.isBundle) return [];

  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const withResults = allProducts.filter((p) => p.beforeImage && p.afterImage && !p.isBundle);
  const toEntry = (p: ShopifyProduct) => ({
    name: p.name,
    beforeUrl: p.beforeImage!,
    afterUrl: p.afterImage!,
  });

  const memberNames = (product.bundleIngredients ?? "")
    .split("\n")
    .map((line) => {
      const pipeIdx = line.indexOf("|");
      return normalize(pipeIdx === -1 ? line : line.slice(0, pipeIdx));
    })
    .filter(Boolean);

  const matched = memberNames
    .map((name) => withResults.find((p) => normalize(p.name) === name))
    .filter((p): p is ShopifyProduct => Boolean(p))
    .map(toEntry);

  return matched.length > 0 ? matched : withResults.map(toEntry);
}
