import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Serves /robots.txt. Before this the route 404'd — meaning the ONLY robots.txt
// under this brand was Shopify's on shop.amnehofficial.com, which allows
// everything and advertises a full sitemap of the duplicate catalog.
//
// Note the deliberate split between what is blocked HERE and what is blocked
// with a noindex meta tag (see lib/seo.ts). robots.txt blocks CRAWLING, which
// also stops Google from ever reading a noindex on the same page — so the two
// must never target the same URL. Rule of thumb applied below: pages that
// should stay out of the index but are linked from the site (/login, /signup,
// /profile, /activate) carry a noindex meta and are NOT listed here; paths that
// should never be fetched at all are listed here.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Staff-only. Also noindex'd in app/admin/layout.tsx as a backstop.
          "/admin",
          // JSON endpoints — no search value, and crawling them wastes crawl
          // budget that should go to product pages.
          "/api/",
          // The bfcache cache-buster from app/layout.tsx appends a unique
          // ?_rb=<timestamp> on return from checkout. Each one is a distinct
          // URL, so without this a crawler could mint unlimited near-duplicate
          // copies of any page. Canonicals already handle the ones that get
          // indexed; this stops them being crawled in the first place.
          "/*?_rb=",
          // Same problem from the other direction: Meta ad clicks arrive with
          // ?fbclid=..., which is unique per click.
          "/*?fbclid=",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // Names the canonical host for the crawlers that honour it (notably Yandex),
    // reinforcing that www.amnehofficial.com — not shop.amnehofficial.com and
    // not a *.vercel.app preview — is the real site.
    host: SITE_URL,
  };
}
