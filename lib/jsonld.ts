// JSON-LD structured data builders.
//
// One <script type="application/ld+json"> per page, containing a single
// @graph array rather than several loose scripts. The nodes cross-reference
// each other by @id — so the Product on a PDP points at the same Organization
// node the home page declares, instead of each page asserting its own
// disconnected copy of the brand. Google explicitly prefers this shape, and it
// is what lets the brand accumulate as one entity rather than N unrelated ones.
//
// Every @id is absolute against SITE_URL (see lib/seo.ts for why the origin is
// pinned rather than inferred from the request host).
import type { ShopifyProduct } from "@/lib/shopify";
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION } from "@/lib/seo";
import { WHATSAPP_PHONE } from "@/lib/contact";

// Stable node identifiers. These are fragment URIs, not fetchable pages — the
// point is that every page in the site refers to the brand by the SAME string.
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const LOGO_ID = `${SITE_URL}/#logo`;

const EMAIL = "amnehofficial@gmail.com";

// Public profiles, used for `sameAs` — how a search engine confirms that this
// Organization node and those social accounts are the same real business.
// Add Facebook/TikTok/YouTube here as they're confirmed; an empty or wrong
// entry is worse than a short list.
const SOCIAL_PROFILES = ["https://www.instagram.com/amnehofficial"];

type Node = Record<string, unknown>;

/** The brand itself. Referenced by every other page via ORG_ID. */
export function organizationNode(): Node {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      "@id": LOGO_ID,
      url: `${SITE_URL}/amneh.png`,
      caption: SITE_NAME,
    },
    image: { "@id": LOGO_ID },
    description: DEFAULT_DESCRIPTION,
    email: EMAIL,
    areaServed: { "@type": "Country", name: "Pakistan" },
    sameAs: SOCIAL_PROFILES,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        // Sourced from lib/contact.ts so a WhatsApp number swap updates the
        // structured data too — that number has changed more than once.
        telephone: `+${WHATSAPP_PHONE}`,
        email: EMAIL,
        availableLanguage: ["en", "ur"],
      },
    ],
  };
}

/** The site as a whole. No SearchAction: there is no /search route, and
 *  declaring a search endpoint that doesn't exist is a validation error. */
export function websiteNode(): Node {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

/** A single page, tied back to the site and brand. */
export function webPageNode({
  path,
  name,
  description,
}: {
  path: string;
  name: string;
  description: string;
}): Node {
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  return {
    "@type": "WebPage",
    // `${SITE_URL}${path}` rather than `${url}#webpage` so the home page's id is
    // ".../#webpage" and not ".../#webpage" without the slash — keeping its
    // shape consistent with ORG_ID and WEBSITE_ID.
    "@id": `${SITE_URL}${path}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

/**
 * Breadcrumb trail. Google renders this in place of the raw URL in results,
 * so "amnehofficial.com › Skincare › Glow Serum" replaces a bare link.
 * `trail` excludes Home, which is prepended here.
 */
export function breadcrumbNode(
  trail: { name: string; path: string }[],
  pageUrl: string
): Node {
  const items = [{ name: "Home", path: "/" }, ...trail];
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.path === "/" ? SITE_URL : `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * A list of products, for the home page and collection pages.
 *
 * Carries only position/url/name per entry, NOT full Product nodes. Price,
 * availability and rating belong on the product's own page, where they are
 * backed by the real page content; duplicating a partial copy here produces
 * "missing field" warnings and no benefit.
 */
export function itemListNode(
  products: ShopifyProduct[],
  { id, name }: { id: string; name: string }
): Node {
  const listed = products.filter((p) => p.handle);
  return {
    "@type": "ItemList",
    "@id": id,
    name,
    numberOfItems: listed.length,
    itemListElement: listed.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/products/${p.handle}`,
      name: p.name,
    })),
  };
}

/**
 * A product with its offer — the node that earns price and availability in the
 * search result itself.
 *
 * Availability comes from `totalInventory`, which is -1 when Shopify isn't
 * tracking inventory for that product; -1 means "not tracked", NOT "sold out",
 * so it maps to InStock. Only a real 0 is OutOfStock.
 */
export function productNode(product: ShopifyProduct): Node {
  const url = `${SITE_URL}/products/${product.handle}`;
  const description = (product.tagline || product.description || DEFAULT_DESCRIPTION)
    .replace(/\s+/g, " ")
    .trim();

  return {
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description,
    url,
    image: product.images.map((img) => img.url),
    sku: product.handle,
    brand: { "@id": ORG_ID },
    ...(product.category && product.category !== "all"
      ? { category: product.category }
      : {}),
    offers: {
      "@type": "Offer",
      "@id": `${url}#offer`,
      url,
      price: product.price,
      priceCurrency: "PKR",
      availability:
        product.totalInventory === 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      // Shopify validates live price and stock at checkout regardless; this
      // window just tells Google the quoted price isn't indefinite.
      priceValidUntil: priceValidUntil(),
      seller: { "@id": ORG_ID },
      hasMerchantReturnPolicy: { "@id": `${SITE_URL}/returns#policy` },
      shippingDetails: { "@id": `${SITE_URL}/shipping#details` },
    },
  };
}

/**
 * Return policy, referenced by every Offer.
 *
 * MerchantReturnNotPermitted is the accurate mapping of app/returns/page.tsx:
 * these are hygiene-sensitive skincare items, so undamaged goods cannot be
 * returned or exchanged and no cash refunds are issued at all. The separate
 * replace-a-damaged-item promise is warranty handling, not a return window, and
 * schema.org has no field for it — so it stays on the page in prose.
 *
 * Deliberately NOT claiming a finite return window here. Declaring one would
 * make Google advertise a returns offer the business does not honour, which is
 * a manual-action risk and an angry-customer risk, not merely a data mismatch.
 * If the written policy ever changes, change it here in the same commit.
 */
export function returnPolicyNode(): Node {
  return {
    "@type": "MerchantReturnPolicy",
    "@id": `${SITE_URL}/returns#policy`,
    applicableCountry: "PK",
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
  };
}

/**
 * Shipping terms, referenced by every Offer. Mirrors app/shipping/page.tsx:
 * free above PKR 2,500, processed in 1-2 days, delivered across Pakistan in
 * 2-7 business days.
 *
 * The zero rate is qualified by eligibleTransactionVolume rather than declared
 * unconditionally — free shipping only applies above PKR 2,500, and orders
 * below that pay a flat fee. That fee is not stated on the shipping page (it is
 * "shown at checkout"), so it is not modelled here: an invented number would be
 * a false price claim. The free tier with its real threshold is both accurate
 * and the part worth advertising.
 */
export function shippingDetailsNode(): Node {
  return {
    "@type": "OfferShippingDetails",
    "@id": `${SITE_URL}/shipping#details`,
    shippingRate: {
      "@type": "MonetaryAmount",
      value: 0,
      currency: "PKR",
    },
    eligibleTransactionVolume: {
      "@type": "PriceSpecification",
      priceCurrency: "PKR",
      minPrice: 2500,
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "PK",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 2,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 2,
        maxValue: 7,
        unitCode: "DAY",
      },
    },
  };
}

/** Wraps nodes into the single @graph document a page embeds. */
export function graph(nodes: Node[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

// Google wants a priceValidUntil on offers; an absent or past date downgrades
// the rich result. One year out, recomputed per render, so it never goes stale.
function priceValidUntil(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}
