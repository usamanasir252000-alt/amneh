import type { Metadata } from "next";
import { getProducts } from "@/lib/shopify";
import { SITE_URL, DEFAULT_DESCRIPTION } from "@/lib/seo";
import {
  graph,
  organizationNode,
  websiteNode,
  webPageNode,
  itemListNode,
} from "@/lib/jsonld";
import JsonLd from "@/components/JsonLd";
import HomeClient from "./HomeClient";

// The title/description/OG tags come from the root layout defaults — this page
// only needs to claim the canonical. It matters most here: paid traffic lands on
// "/" carrying ?fbclid=... from Meta and ?_rb=<timestamp> from the bfcache fix
// in app/layout.tsx, and each variant is a separate URL to a crawler. The
// self-referencing canonical folds them all back into the bare home page.
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

// SERVER component. Fetching products here (not in a client useEffect) bakes the
// product carousel into the initial HTML — so visitors from Facebook/Instagram
// in-app browsers, which routinely stall or never run JavaScript, still see real
// products on first paint instead of a blank/loading page. .catch keeps the page
// rendering even if Shopify is briefly unreachable (the client carousel then
// falls back to its own retry fetch).
// ISR (not force-dynamic): the page is served from cache instantly and
// refreshed in the background at most every 2 minutes — navigating back home
// from a product no longer re-renders and re-fetches the whole catalog live.
export const revalidate = 120;

export default async function Home() {
  const products = await getProducts().catch(() => []);

  // The Organization + WebSite nodes are declared HERE, on the home page, and
  // every other page refers back to them by @id rather than redeclaring them.
  const data = graph([
    organizationNode(),
    websiteNode(),
    webPageNode({
      path: "/",
      name: "Amneh | Best Skincare Brand in Pakistan",
      description: DEFAULT_DESCRIPTION,
    }),
    itemListNode(products, {
      id: `${SITE_URL}/#featured-products`,
      name: "Featured Skincare",
    }),
  ]);

  return (
    <>
      <JsonLd data={data} />
      <HomeClient initialProducts={products} />
    </>
  );
}
