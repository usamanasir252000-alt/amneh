// Single source of truth for everything SEO-facing: the canonical origin, the
// brand strings that go in <title>/OG tags, and the helper that builds a page's
// Metadata object.
//
// WHY a canonical origin constant: this storefront is reachable at more than one
// host. www.amnehofficial.com is the real site; shop.amnehofficial.com is
// SHOPIFY'S CHECKOUT domain (see the preconnect note in app/layout.tsx), and
// Vercel also serves every deploy on a *.vercel.app preview URL. Without one
// pinned origin, canonical tags would render relative to whatever host answered
// the request, so Google would see three copies of every product page and pick
// a winner itself — often the preview or the Shopify domain. Every canonical
// below is absolute against SITE_URL so all of them collapse onto the real site.
export const SITE_URL = "https://www.amnehofficial.com";

export const SITE_NAME = "Amneh";

// Appended to every page title except the home page (which sets its own full
// title). Kept short: Google truncates around ~60 characters, and a long suffix
// eats the part that actually differentiates the page.
export const TITLE_SUFFIX = "Amneh";

export const DEFAULT_DESCRIPTION =
  "Luxury beauty essentials crafted to elevate your glow with confidence and elegance.";

// The share image used when a page has nothing more specific (product pages
// pass their own hero image instead).
export const DEFAULT_OG_IMAGE = "/amneh.png";

import type { Metadata } from "next";

/**
 * Build the Metadata for a normal, indexable page.
 *
 * `path` is the site-relative path ("/shipping"). It becomes the canonical URL
 * and the og:url — a SELF-REFERENCING canonical, which is what kills the
 * duplicate-URL problem on this site: ad traffic arrives with ?fbclid=..., and
 * the bfcache fix in app/layout.tsx bounces shoppers through ?_rb=<timestamp>.
 * Both are distinct URLs to a crawler. A self-referencing canonical tells Google
 * every one of those variants is the same page as the clean path.
 */
export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
}: {
  title: string;
  description?: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_PK",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    // index:false keeps the page out of results; follow:true still lets crawlers
    // walk the nav/footer links out of it into the pages that do matter.
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * Metadata for account/utility pages (login, signup, profile, activate).
 *
 * These have no search value and several are per-user, so they are noindex.
 * `follow` stays TRUE so crawlers still traverse the nav/footer links out of
 * them into the pages that do matter.
 */
export function utilityPageMetadata(title: string, path: string): Metadata {
  return pageMetadata({
    title,
    description: DEFAULT_DESCRIPTION,
    path,
    noIndex: true,
  });
}
