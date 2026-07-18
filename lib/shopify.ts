const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;
const API_VERSION = "2024-04";

const CART_FIELDS = `
  id
  checkoutUrl
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            price { amount }
            product {
              title
              handle
              images(first: 1) { edges { node { url } } }
            }
          }
        }
      }
    }
  }
`;

export interface ShopifyProduct {
  id: string;
  handle: string;
  variantId: string;
  name: string;
  type: string;
  price: number;
  compareAtPrice: number | null;
  shades: string;
  badge: string;
  tagline: string | null;
  description: string | null;
  category: string;
  images: { id: string; url: string; sortOrder: number }[];
  ingredients: string | null;
  howToUse: string | null;
  benefits: string | null;
  patchTest: string | null;
  whenToUse: string | null;
  spotlightImages: string | null;
  bundleIngredients: string | null;
  mobileHeroImage: string | null;
  desktopHeroImage: string | null;
  // Optional per-product UGC/testimonial video, shown as a dismissable popup on
  // the product page. Sourced from Shopify metafield custom.ugc_video. Value is
  // a video URL, optionally with a trim range: "url" or "url | startSec | endSec".
  ugcVideo: string | null;
  // Optional trim points (seconds) for the UGC popup video, from dedicated
  // metafields custom.ugc_video_start / custom.ugc_video_end — a simpler way to
  // trim than the pipe syntax. Override any trim baked into ugcVideo itself.
  ugcVideoStart: number | null;
  ugcVideoEnd: number | null;
  // True when the product is tagged "bundle" in Shopify — i.e. it already
  // packages multiple products together. Used to suppress the "buy more, save
  // more" quantity-bundle offer on it (stacking a bundle discount on top of a
  // product that's already a bundle makes no sense).
  isBundle: boolean;
}

export interface ShopifyCartLine {
  lineId: string;
  variantId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  lines: ShopifyCartLine[];
}

async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  opts?: { buyerIp?: string }
): Promise<T> {
  const endpoint = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
  };
  // Required by Shopify to carry a logged-in customer's session from the cart
  // into checkout on server-side Storefront API requests. Without it, the
  // customer is associated to the cart but checkout still shows "Sign in".
  if (opts?.buyerIp) headers["Shopify-Storefront-Buyer-IP"] = opts.buyerIp;

  // Hard timeout so a slow/unresponsive Shopify call can't hang the request —
  // and, downstream, the checkout redirect — indefinitely.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`Shopify API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

// Only four badge types are allowed to show, ever. "new" is explicit-tag
// only — it's excluded from the random/round-robin fallback pool below,
// since labeling an untagged older product "New" by chance would be
// misleading. A product only shows "New" if actually tagged that in Shopify.
const BADGE_SIGNAL_TAGS = [
  "new", "best selling", "best seller", "bestseller",
  "customer favorite", "customer favourite", "customer fav", "most loved",
];
const FALLBACK_BADGES = ["best selling", "customer fav", "most loved"];

function hasBadgeSignalTag(tags: string[]): boolean {
  return tags.some((t) => BADGE_SIGNAL_TAGS.some((b) => t.toLowerCase().includes(b)));
}

// Deterministic (same product → same badge across requests) but only used
// as a single-product fallback (getProductByHandle, which has no sibling
// products to spread badges across). getProducts() below instead assigns
// fallback badges round-robin across the whole result set, which is what
// actually guarantees no two products in the same listing show the same
// badge — a hash can collide, especially with a small catalog and only 3
// fallback labels; round-robin by position cannot.
function hashFallbackBadge(handle: string): string {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  return FALLBACK_BADGES[hash % FALLBACK_BADGES.length];
}

function normalizeProduct(node: {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  priceRange: { minVariantPrice: { amount: string } };
  compareAtPriceRange?: { maxVariantPrice: { amount: string } } | null;
  images: { edges: { node: { id: string; url: string } }[] };
  variants: { edges: { node: { id: string } }[] };
  ingredients?: { value: string } | null;
  howToUse?: { value: string } | null;
  benefits?: { value: string } | null;
  patchTest?: { value: string } | null;
  whenToUse?: { value: string } | null;
  spotlightImages?: { value: string } | null;
  bundleIngredients?: { value: string } | null;
  mobileHeroImage?: { value: string } | null;
  desktopHeroImage?: { value: string } | null;
  ugcVideo?: { value: string } | null;
  ugcVideoStart?: { value: string } | null;
  ugcVideoEnd?: { value: string } | null;
}): ShopifyProduct {
  const tags = node.tags ?? [];
  const matchedBadge = tags.find((t) => BADGE_SIGNAL_TAGS.some((b) => t.toLowerCase().includes(b)));
  const badge = matchedBadge ?? hashFallbackBadge(node.handle);

  return {
    id: node.handle,
    handle: node.handle,
    variantId: node.variants.edges[0]?.node.id ?? "",
    name: node.title,
    type: node.productType || "product",
    price: parseFloat(node.priceRange.minVariantPrice.amount),
    compareAtPrice: (() => {
      const amt = parseFloat(node.compareAtPriceRange?.maxVariantPrice?.amount ?? "0");
      return amt > 0 ? amt : null;
    })(),
    shades: tags
      .filter((t) => t.startsWith("shades:"))
      .map((t) => t.slice(7))
      .join(", "),
    badge,
    tagline: null,
    description: node.description || null,
    category: (node.productType || "all").toLowerCase(),
    images: node.images.edges.map((e, i) => ({
      id: e.node.id ?? `img-${i}`,
      url: e.node.url,
      sortOrder: i,
    })),
    ingredients: node.ingredients?.value ?? null,
    howToUse: node.howToUse?.value ?? null,
    benefits: node.benefits?.value ?? null,
    patchTest: node.patchTest?.value ?? null,
    whenToUse: node.whenToUse?.value ?? null,
    spotlightImages: node.spotlightImages?.value ?? null,
    bundleIngredients: node.bundleIngredients?.value ?? null,
    mobileHeroImage: node.mobileHeroImage?.value ?? null,
    desktopHeroImage: node.desktopHeroImage?.value ?? null,
    ugcVideo: node.ugcVideo?.value ?? null,
    ugcVideoStart: (() => { const n = parseFloat(node.ugcVideoStart?.value ?? ""); return Number.isFinite(n) ? n : null; })(),
    ugcVideoEnd: (() => { const n = parseFloat(node.ugcVideoEnd?.value ?? ""); return Number.isFinite(n) ? n : null; })(),
    isBundle: tags.some((t) => t.trim().toLowerCase() === "bundle"),
  };
}

function normalizeCart(cart: {
  id: string;
  checkoutUrl: string;
  lines: {
    edges: {
      node: {
        id: string;
        quantity: number;
        merchandise: {
          id: string;
          price: { amount: string };
          product: {
            title: string;
            handle: string;
            images: { edges: { node: { url: string } }[] };
          };
        };
      };
    }[];
  };
}): ShopifyCart {
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    lines: cart.lines.edges.map((e) => ({
      lineId: e.node.id,
      variantId: e.node.merchandise.id,
      name: e.node.merchandise.product.title,
      price: parseFloat(e.node.merchandise.price.amount),
      image: e.node.merchandise.product.images.edges[0]?.node.url ?? "",
      quantity: e.node.quantity,
    })),
  };
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function getProducts(category?: string): Promise<ShopifyProduct[]> {
  const queryFilter =
    category && category !== "all"
      ? `tag:${category}`
      : undefined;

  const data = await shopifyFetch<{
    products: { edges: { node: Parameters<typeof normalizeProduct>[0] }[] };
  }>(
    `
    query GetProducts($first: Int!, $query: String) {
      products(first: $first, query: $query) {
        edges {
          node {
            id
            handle
            title
            description
            productType
            tags
            priceRange { minVariantPrice { amount } }
            compareAtPriceRange { maxVariantPrice { amount } }
            images(first: 5) { edges { node { id url } } }
            variants(first: 1) { edges { node { id } } }
          }
        }
      }
    }
  `,
    { first: 50, query: queryFilter }
  );

  const products = data.products.edges.map((e) => normalizeProduct(e.node));

  // Round-robin the fallback badges across THIS result set — guarantees no
  // two untagged products in the same listing (e.g. the same category grid)
  // show the same badge. normalizeProduct's hash-based pick (used above)
  // can't guarantee that on its own since a hash can collide, especially
  // with a small catalog and only 3 fallback labels. Products with a real
  // merchandiser tag (checked independently here) are left untouched.
  let fallbackIdx = 0;
  data.products.edges.forEach((e, i) => {
    if (!hasBadgeSignalTag(e.node.tags ?? [])) {
      products[i].badge = FALLBACK_BADGES[fallbackIdx % FALLBACK_BADGES.length];
      fallbackIdx++;
    }
  });

  return products;
}

export async function getProductByHandle(
  handle: string
): Promise<ShopifyProduct | null> {
  const data = await shopifyFetch<{
    product: Parameters<typeof normalizeProduct>[0] | null;
  }>(
    `
    query GetProduct($handle: String!) {
      product(handle: $handle) {
        id
        handle
        title
        description
        productType
        tags
        priceRange { minVariantPrice { amount } }
        compareAtPriceRange { maxVariantPrice { amount } }
        images(first: 10) { edges { node { id url } } }
        variants(first: 1) { edges { node { id } } }
        ingredients: metafield(namespace: "custom", key: "ingredients") { value }
        howToUse: metafield(namespace: "custom", key: "how_to_use") { value }
        benefits: metafield(namespace: "custom", key: "benefits") { value }
        patchTest: metafield(namespace: "custom", key: "patch_test") { value }
        whenToUse: metafield(namespace: "custom", key: "when_to_use") { value }
        spotlightImages: metafield(namespace: "custom", key: "spotlight_images") { value }
        bundleIngredients: metafield(namespace: "custom", key: "bundle_ingredients") { value }
        mobileHeroImage: metafield(namespace: "custom", key: "mobile_hero_image") { value }
        desktopHeroImage: metafield(namespace: "custom", key: "desktop_hero_image") { value }
        ugcVideo: metafield(namespace: "custom", key: "ugc_video") { value }
        ugcVideoStart: metafield(namespace: "custom", key: "ugc_video_start") { value }
        ugcVideoEnd: metafield(namespace: "custom", key: "ugc_video_end") { value }
      }
    }
  `,
    { handle }
  );

  if (!data.product) return null;
  return normalizeProduct(data.product);
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function createCart(
  variantId: string,
  quantity: number,
  discountCodes?: string[]
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartCreate: {
      cart: Parameters<typeof normalizeCart>[0];
      userErrors: { message: string }[];
    };
  }>(
    `
    mutation CartCreate($lines: [CartLineInput!], $discountCodes: [String!]) {
      cartCreate(input: { lines: $lines, discountCodes: $discountCodes }) {
        cart { ${CART_FIELDS} }
        userErrors { field message }
      }
    }
  `,
    { lines: [{ merchandiseId: variantId, quantity }], discountCodes: discountCodes ?? [] }
  );

  if (data.cartCreate.userErrors.length) {
    throw new Error(data.cartCreate.userErrors[0].message);
  }
  return normalizeCart(data.cartCreate.cart);
}

// Applies (or clears, with []) discount codes on an existing cart. Shopify
// silently ignores a code whose conditions aren't met (e.g. min quantity),
// so this never throws on an invalid code — the cart just comes back without
// it applied.
export async function applyCartDiscount(
  cartId: string,
  discountCodes: string[]
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartDiscountCodesUpdate: {
      cart: Parameters<typeof normalizeCart>[0];
      userErrors: { message: string }[];
    };
  }>(
    `
    mutation CartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) {
      cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
        cart { ${CART_FIELDS} }
        userErrors { field message }
      }
    }
  `,
    { cartId, discountCodes }
  );

  if (data.cartDiscountCodesUpdate.userErrors.length) {
    throw new Error(data.cartDiscountCodesUpdate.userErrors[0].message);
  }
  return normalizeCart(data.cartDiscountCodesUpdate.cart);
}

export async function addCartLine(
  cartId: string,
  variantId: string,
  quantity: number
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesAdd: {
      cart: Parameters<typeof normalizeCart>[0];
      userErrors: { message: string }[];
    };
  }>(
    `
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ${CART_FIELDS} }
        userErrors { field message }
      }
    }
  `,
    { cartId, lines: [{ merchandiseId: variantId, quantity }] }
  );

  if (data.cartLinesAdd.userErrors.length) {
    throw new Error(data.cartLinesAdd.userErrors[0].message);
  }
  return normalizeCart(data.cartLinesAdd.cart);
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesUpdate: {
      cart: Parameters<typeof normalizeCart>[0];
      userErrors: { message: string }[];
    };
  }>(
    `
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ${CART_FIELDS} }
        userErrors { field message }
      }
    }
  `,
    { cartId, lines: [{ id: lineId, quantity }] }
  );

  if (data.cartLinesUpdate.userErrors.length) {
    throw new Error(data.cartLinesUpdate.userErrors[0].message);
  }
  return normalizeCart(data.cartLinesUpdate.cart);
}

export async function removeCartLine(
  cartId: string,
  lineId: string
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartLinesRemove: {
      cart: Parameters<typeof normalizeCart>[0];
      userErrors: { message: string }[];
    };
  }>(
    `
    mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ${CART_FIELDS} }
        userErrors { field message }
      }
    }
  `,
    { cartId, lineIds: [lineId] }
  );

  if (data.cartLinesRemove.userErrors.length) {
    throw new Error(data.cartLinesRemove.userErrors[0].message);
  }
  return normalizeCart(data.cartLinesRemove.cart);
}

export interface CartBuyerIdentityInput {
  customerAccessToken?: string;
  email?: string;
}

export async function linkCartToCustomer(
  cartId: string,
  buyerIdentity: CartBuyerIdentityInput,
  buyerIp?: string
): Promise<{ checkoutUrl: string | null }> {
  const data = await shopifyFetch<{
    cartBuyerIdentityUpdate: {
      cart: {
        id: string;
        checkoutUrl: string;
        buyerIdentity: { email: string | null; customer: { id: string } | null };
      } | null;
      userErrors: { field: string[]; message: string }[];
    };
  }>(
    `
    mutation CartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
      cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
        cart {
          id
          checkoutUrl
          buyerIdentity { email customer { id } }
        }
        userErrors { field message }
      }
    }
  `,
    { cartId, buyerIdentity },
    { buyerIp }
  );

  const result = data.cartBuyerIdentityUpdate;
  console.log("[linkCartToCustomer] input:", {
    cartId,
    hasToken: !!buyerIdentity.customerAccessToken,
    hasEmail: !!buyerIdentity.email,
    hasBuyerIp: !!buyerIp,
  });
  console.log("[linkCartToCustomer] result buyerIdentity:", JSON.stringify(result.cart?.buyerIdentity));
  if (result.userErrors?.length) {
    console.error("[linkCartToCustomer] userErrors:", JSON.stringify(result.userErrors));
  }
  return { checkoutUrl: result.cart?.checkoutUrl ?? null };
}

export async function fetchCart(cartId: string): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<{
    cart: Parameters<typeof normalizeCart>[0] | null;
  }>(
    `
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        ${CART_FIELDS}
      }
    }
  `,
    { cartId }
  );

  if (!data.cart) return null;
  return normalizeCart(data.cart);
}
