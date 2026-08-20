import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/shopify";
import { SITE_URL } from "@/lib/seo";

// Serves /sitemap.xml.
//
// This is a cached Route Handler, and getProducts() reads through the same
// "catalog"-tagged Next data cache as the storefront pages. So when Shopify
// fires a products/* webhook, app/api/webhooks/shopify/route.ts calls
// revalidateTag("catalog") and this sitemap picks up the new product on its
// next request — no deploy needed to get a new product listed.
//
// Deliberately NOT emitted: `priority` and `changeFrequency`. Google states
// outright that it ignores both, so they are pure bytes. `lastModified` IS
// emitted, but only where a real timestamp exists — see the note below.

// Static routes worth indexing. Everything absent is intentional: /login,
// /signup, /profile and /activate are noindex account pages, /admin is
// staff-only, and /api/* is not content. A URL that is noindex must not appear
// in the sitemap — telling Google "index this" and "don't index this" at once
// is a contradiction that shows up as a Search Console warning.
const STATIC_ROUTES = [
  "/",
  "/skincare",
  "/discover",
  "/rewards",
  "/contact",
  "/shipping",
  "/returns",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A Shopify outage must not take down the sitemap: falling back to an empty
  // catalog still emits every static route, which is far better than serving a
  // 500 that Search Console records as a fetch failure.
  const products = await getProducts().catch(() => []);

  const productEntries: MetadataRoute.Sitemap = products
    .filter((p) => p.handle)
    .map((p) => ({
      url: `${SITE_URL}/products/${p.handle}`,
      // Only set lastModified when Shopify actually gave us a timestamp.
      // Substituting `new Date()` here would mark every product as changed on
      // every request — Google treats a lastmod that is not "consistently and
      // verifiably accurate" as noise and stops trusting the field site-wide,
      // so a missing lastmod is strictly better than a fabricated one.
      ...(p.updatedAt ? { lastModified: new Date(p.updatedAt) } : {}),
      // Image sitemap entries. Worth the bytes for a skincare catalog: it gets
      // product photos into Google Images, which is a real discovery surface
      // for this category, and ties each image to the page that sells it.
      ...(p.images.length ? { images: p.images.map((img) => img.url) } : {}),
    }));

  // Static pages carry no lastModified for the same reason as above — this
  // codebase has no per-page content timestamp, and the deploy date is not one.
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
  }));

  return [...staticEntries, ...productEntries];
}
