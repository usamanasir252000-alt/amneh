import { getProducts } from "@/lib/shopify";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import {
  graph,
  webPageNode,
  itemListNode,
  breadcrumbNode,
} from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";
import SkincareClient from "./SkincareClient";

export const metadata = pageMetadata({
  title: "Skincare Serums",
  description:
    "Shop Amneh serums — brightening, hydrating and barrier-repair formulas. Delivered across Pakistan, free shipping on orders above PKR 2,500.",
  path: "/skincare",
});

// SERVER component. Fetching the serum products here (not in a client useEffect)
// bakes the product grid into the initial HTML — so visitors from Facebook/
// Instagram in-app browsers, which routinely stall or never run JavaScript,
// see real products on first paint instead of a blank/loading page. .catch
// keeps the page rendering if Shopify is briefly unreachable (the client then
// falls back to its own retry fetch).
// ISR (not force-dynamic): served from cache instantly, refreshed in the
// background at most every 2 minutes — same freshness trade-off as the PDP.
export const revalidate = 120;

export default async function SkincarePage() {
  const products = await getProducts("serums").catch(() => []);

  const data = graph([
    {
      // CollectionPage rather than WebPage: this is a listing of products, and
      // the type is what lets the ItemList below be understood as its contents.
      ...webPageNode({
        path: "/skincare",
        name: "Skincare Serums",
        description:
          "Shop Amneh serums — brightening, hydrating and barrier-repair formulas.",
      }),
      "@type": "CollectionPage",
    },
    itemListNode(products, {
      id: `${SITE_URL}/skincare#products`,
      name: "Skincare Serums",
    }),
    breadcrumbNode([{ name: "Skincare", path: "/skincare" }], `${SITE_URL}/skincare`),
  ]);

  return (
    <>
      <JsonLd data={data} />
      <SkincareClient initialProducts={products} />
    </>
  );
}
