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
  shades: string;
  badge: string;
  tagline: string | null;
  description: string | null;
  category: string;
  images: { id: string; url: string; sortOrder: number }[];
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
  variables?: Record<string, unknown>
): Promise<T> {
  const endpoint = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Shopify API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

function normalizeProduct(node: {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  priceRange: { minVariantPrice: { amount: string } };
  images: { edges: { node: { id: string; url: string } }[] };
  variants: { edges: { node: { id: string } }[] };
}): ShopifyProduct {
  const tags = node.tags ?? [];
  const badgeTags = ["best seller", "bestseller", "new", "limited", "sale"];
  const badge =
    tags.find((t) => badgeTags.some((b) => t.toLowerCase().includes(b))) ??
    tags[0] ??
    "new";

  return {
    id: node.handle,
    handle: node.handle,
    variantId: node.variants.edges[0]?.node.id ?? "",
    name: node.title,
    type: node.productType || "product",
    price: parseFloat(node.priceRange.minVariantPrice.amount),
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
            images(first: 5) { edges { node { id url } } }
            variants(first: 1) { edges { node { id } } }
          }
        }
      }
    }
  `,
    { first: 50, query: queryFilter }
  );

  return data.products.edges.map((e) => normalizeProduct(e.node));
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
        images(first: 10) { edges { node { id url } } }
        variants(first: 1) { edges { node { id } } }
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
  quantity: number
): Promise<ShopifyCart> {
  const data = await shopifyFetch<{
    cartCreate: {
      cart: Parameters<typeof normalizeCart>[0];
      userErrors: { message: string }[];
    };
  }>(
    `
    mutation CartCreate($lines: [CartLineInput!]) {
      cartCreate(input: { lines: $lines }) {
        cart { ${CART_FIELDS} }
        userErrors { field message }
      }
    }
  `,
    { lines: [{ merchandiseId: variantId, quantity }] }
  );

  if (data.cartCreate.userErrors.length) {
    throw new Error(data.cartCreate.userErrors[0].message);
  }
  return normalizeCart(data.cartCreate.cart);
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
