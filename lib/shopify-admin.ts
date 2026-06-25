import bcrypt from "bcryptjs";
import crypto from "crypto";
import { POINTS_PER_ORDER, MIN_ORDER_VALUE, REWARDS } from "./loyalty";

const CLIENT_ID = process.env.AUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET!;
const SHOPIFY_DOMAIN_RAW =
  process.env.SHOPIFY_STORE?.replace(/^https?:\/\//, "") ??
  process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "");
if (!SHOPIFY_DOMAIN_RAW) {
  throw new Error("Missing SHOPIFY_STORE or SHOPIFY_STORE_DOMAIN env var");
}
const SHOPIFY_DOMAIN = SHOPIFY_DOMAIN_RAW.replace(/\/$/, "");
const SHOPIFY_BASE_URL = `https://${SHOPIFY_DOMAIN}`;
const version = "2026-04";
type ShopifyCustomer = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  metafields?: Record<string, string>;
};
interface TokenResponse {
  access_token: string;
  expires_in: number;
}

let token: string | null = null;
let tokenExpiresAt = 0;

export async function getToken(): Promise<string> {
  // Reuse token if it's still valid (with 1 minute buffer)
  if (token && Date.now() < tokenExpiresAt - 60_000) {
    return token;
  }

  const response = await fetch(`${SHOPIFY_BASE_URL}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status}`);
  }

  const data: TokenResponse = await response.json();

  token = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return token;
}
async function shopifyAdminFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
) {
  const endpoint = `${SHOPIFY_BASE_URL}/admin/api/${version}/graphql.json`;
  const accessToken = await getToken();

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok)
    throw new Error(`Shopify Admin API error ${res.status}: ${text}`);
  const json = JSON.parse(text);
  if (json.errors && json.errors.length) {
    const message = json.errors.map((e: any) => e.message).join("; ");
    throw new Error(`Shopify Admin API GraphQL error: ${message}`);
  }
  return json.data as T;
}

export async function getCustomerByEmail(
  email: string,
): Promise<ShopifyCustomer | null> {
  const q = `
    query CustomersByEmail($query: String!) {
      customers(first: 1, query: $query) {
        edges {
          node {
            id
            email
            firstName
            lastName
            metafields(namespace: "auth", first: 10) { edges { node { key value } } }
          }
        }
      }
    }
  `;

  const sanitizedEmail = email.replace(/"/g, `\\"`);
  const data = await shopifyAdminFetch<{
    customers: { edges: { node: any }[] };
  }>(q, { query: `email:"${sanitizedEmail}"` });

  const node = data.customers.edges[0]?.node;
  if (!node) return null;
  const mf: Record<string, string> = {};
  (node.metafields?.edges ?? []).forEach(
    (e: any) => (mf[e.node.key] = e.node.value),
  );
  return {
    id: node.id,
    email: node.email,
    firstName: node.firstName,
    lastName: node.lastName,
    metafields: mf,
  };
}

export async function createCustomer(payload: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
}) {
  const email = payload.email.toLowerCase();
  const m = `
    mutation CreateCustomer($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
          smsMarketingConsent { marketingState marketingOptInLevel consentUpdatedAt }
          emailMarketingConsent { marketingState marketingOptInLevel consentUpdatedAt }
          tags
        }
        userErrors { field message }
      }
    }
  `;

  const input: Record<string, unknown> = {
    email,
    firstName: payload.firstName ?? "",
    lastName: payload.lastName ?? "",
    emailMarketingConsent: {
      marketingState: "SUBSCRIBED",
      marketingOptInLevel: "SINGLE_OPT_IN",
    },
    tags: [...(payload.tags ?? []), "whatsapp"],
  };

  if (payload.phone) {
    input.phone = payload.phone;
    input.smsMarketingConsent = {
      marketingState: "SUBSCRIBED",
      marketingOptInLevel: "SINGLE_OPT_IN",
    };
  }

  const data = await shopifyAdminFetch<{ customerCreate: any }>(m, {
    input,
  });
  if (data.customerCreate.userErrors.length)
    throw new Error(
      data.customerCreate.userErrors.map((u: any) => u.message).join(", "),
    );
  return data.customerCreate.customer as {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

// Sends Shopify's "Customer account invite" email (contains the account
// activation link). Works on customers created without a password, i.e. in
// the unactivated/disabled state.
export async function sendCustomerInvite(customerId: string) {
  const numericId = customerId.replace(/^gid:\/\/shopify\/Customer\//, "");
  const accessToken = await getToken();
  const res = await fetch(
    `${SHOPIFY_BASE_URL}/admin/api/${version}/customers/${numericId}/send_invite.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ customer_invite: {} }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`send_invite failed ${res.status}: ${text}`);
  }
  return res.json();
}

export async function setCustomerPasswordHash(
  customerId: string,
  passwordHash: string,
) {
  const mutation = `
    mutation SetMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id key value }
        userErrors { field message }
      }
    }
  `;

  const ownerId = customerId;
  const met = [
    {
      ownerId,
      namespace: "auth",
      key: "passwordHash",
      type: "single_line_text_field",
      value: passwordHash,
    },
  ];
  const data = await shopifyAdminFetch<{ metafieldsSet: any }>(mutation, {
    metafields: met,
  });
  if (data.metafieldsSet.userErrors.length)
    throw new Error(
      data.metafieldsSet.userErrors.map((u: any) => u.message).join(", "),
    );
  return data.metafieldsSet.metafields[0];
}

export async function verifyCustomerPasswordByEmail(
  email: string,
  password: string,
) {
  const customer = await getCustomerByEmail(email.toLowerCase());
  if (!customer) return null;
  const hash = customer.metafields?.passwordHash;
  if (!hash) return null;
  const ok = await bcrypt.compare(password, hash);
  return ok ? customer : null;
}

export async function ensureCustomerForGoogle(payload: {
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  console.log("Ensuring customer for Google auth", { email: payload.email });
  const email = payload.email.toLowerCase();
  const existing = await getCustomerByEmail(email);
  console.log("Existing customer lookup result", { existing });
  if (existing) return existing;

  const created = await createCustomer({
    email,
    firstName: payload.firstName,
    lastName: payload.lastName,
  });
  console.log("Customer created", { created });
  if (created) {
    return {
      id: created.id,
      email: created.email,
      firstName: created.firstName ?? payload.firstName ?? "",
      lastName: created.lastName ?? payload.lastName ?? "",
      metafields: {},
    };
  }

  const customer = await getCustomerByEmail(email);
  console.log("Customer after creation attempt", { customer });
  return customer;
}

// ── Product metafields (bypasses Storefront API access restriction) ────────

export async function getProductMetafields(handle: string): Promise<{
  ingredients: string | null;
  howToUse: string | null;
  benefits: string | null;
}> {
  const q = `
    query ProductMeta($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          ingredients: metafield(namespace: "custom", key: "ingredients") { value }
          howToUse:    metafield(namespace: "custom", key: "how_to_use")  { value }
          benefits:    metafield(namespace: "custom", key: "benefits")    { value }
        }
      }
    }
  `;
  const data = await shopifyAdminFetch<{ products: { nodes: any[] } }>(q, {
    query: `handle:${handle}`,
  });
  console.log('[getProductMetafields] raw nodes:', JSON.stringify(data.products?.nodes ?? []));
  const node = data.products.nodes[0] ?? {};
  const result = {
    ingredients: node.ingredients?.value ?? null,
    howToUse:    node.howToUse?.value    ?? null,
    benefits:    node.benefits?.value    ?? null,
  };
  console.log('[getProductMetafields] result:', JSON.stringify(result));
  return result;
}

// ── Order confirmation helpers (WhatsApp COD verification) ─────────────────

// Returns the most recent order for a phone with its wa- tags included
export async function findOrderByPhone(phone: string): Promise<{
  id: string;
  name: string;
  tags: string[];
  email: string | null;
} | null> {
  const q = `
    query FindOrder($query: String!) {
      orders(first: 5, query: $query, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            cancelledAt
            tags
            email
            customer { email }
          }
        }
      }
    }
  `;
  console.log('[Shopify] searching orders for phone:', phone);
  const data = await shopifyAdminFetch<{ orders: { edges: { node: any }[] } }>(q, {
    query: `phone:${phone}`,
  });

  // Orders come back newest-first. Always anchor to the MOST RECENT order —
  // that's the one the customer's latest WhatsApp prompt was about.
  //
  // The previous code did `.find(o => !o.cancelledAt)`, which skipped the
  // just-cancelled order and walked back to an OLDER one. That's the bug where
  // pressing "Confirm" after a "Cancel" confirmed a different, earlier order.
  // By keeping the latest order even when it's cancelled, a stray "Confirm"
  // resolves to that same order and the handler replies "already cancelled"
  // instead of mis-acting on a previous order.
  const target = data.orders.edges[0]?.node;
  if (!target) return null;

  // Shopify only sends the "Order canceled" email if the order has an email.
  // The order's own email takes precedence; fall back to the linked customer's.
  const email: string | null = target.email ?? target.customer?.email ?? null;
  console.log(
    '[Shopify] target order', target.name,
    '| cancelledAt:', target.cancelledAt ?? 'no',
    '| tags:', (target.tags ?? []).join(',') || '(none)',
    '| email:', email ?? 'NONE (no cancellation email will be sent)'
  );
  return { id: target.id, name: target.name, tags: target.tags ?? [], email };
}

// Tag we stamp on each order carrying the Twilio SID of its WhatsApp prompt,
// so an inbound reply (which reports OriginalRepliedMessageSid) maps back to
// the EXACT order the customer tapped — even with multiple orders open.
//
// IMPORTANT: order tags are capped at 40 chars (products/customers get 255).
// Twilio SIDs are 34 chars, so the prefix must be short and hyphen-free
// (Shopify treats hyphens/special chars unreliably in tag search):
// "wasid" + 34 = 39 chars. A "wa-sid-" prefix made it 41 and Shopify rejected
// it with "Order tags is invalid", so the tag silently never got written.
export function waSidTag(messageSid: string): string {
  return `wasid${messageSid}`;
}

export async function findOrderByMessageSid(messageSid: string): Promise<{
  id: string;
  name: string;
  tags: string[];
  email: string | null;
} | null> {
  const tag = waSidTag(messageSid);
  const q = `
    query FindOrderByTag($query: String!) {
      orders(first: 1, query: $query) {
        edges {
          node {
            id
            name
            cancelledAt
            tags
            email
            customer { email }
          }
        }
      }
    }
  `;
  const data = await shopifyAdminFetch<{ orders: { edges: { node: any }[] } }>(q, {
    query: `tag:"${tag}"`,
  });
  const node = data.orders.edges[0]?.node;
  // Require the exact tag — guards against Shopify's tag search matching loosely.
  if (!node || !(node.tags ?? []).includes(tag)) {
    console.log('[Shopify] no order matched message SID', messageSid);
    return null;
  }
  const email: string | null = node.email ?? node.customer?.email ?? null;
  console.log('[Shopify] matched order by message SID', messageSid, '→', node.name);
  return { id: node.id, name: node.name, tags: node.tags ?? [], email };
}

// Fetches everything needed to fire the Meta CAPI Purchase for a confirmed
// order: value/currency, customer email+phone (for matching), and the Meta
// attribution attributes we stamped on the cart at checkout.
export async function getOrderConversionData(orderGid: string): Promise<{
  value: number;
  currency: string;
  email: string | null;
  phone: string | null;
  fbp: string | null;
  fbc: string | null;
  fbIp: string | null;
  fbUa: string | null;
} | null> {
  const q = `
    query OrderConversion($id: ID!) {
      order(id: $id) {
        email
        phone
        customer { email phone }
        shippingAddress { phone }
        billingAddress { phone }
        totalPriceSet { shopMoney { amount currencyCode } }
        customAttributes { key value }
      }
    }
  `;
  const data = await shopifyAdminFetch<{ order: any }>(q, { id: orderGid });
  const o = data.order;
  if (!o) return null;
  const attrs: Record<string, string> = {};
  for (const a of o.customAttributes ?? []) attrs[a.key] = a.value;
  return {
    value: parseFloat(o.totalPriceSet?.shopMoney?.amount ?? "0"),
    currency: o.totalPriceSet?.shopMoney?.currencyCode ?? "PKR",
    email: o.email ?? o.customer?.email ?? null,
    phone:
      o.phone ??
      o.customer?.phone ??
      o.shippingAddress?.phone ??
      o.billingAddress?.phone ??
      null,
    fbp: attrs["_fbp"] ?? null,
    fbc: attrs["_fbc"] ?? null,
    fbIp: attrs["_fb_ip"] ?? null,
    fbUa: attrs["_fb_ua"] ?? null,
  };
}

export async function addOrderTag(orderId: string, tag: string) {
  const m = `
    mutation TagsAdd($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        node { id }
        userErrors { field message }
      }
    }
  `;
  const data = await shopifyAdminFetch<{ tagsAdd: any }>(m, { id: orderId, tags: [tag] });
  if (data.tagsAdd.userErrors?.length) {
    throw new Error(data.tagsAdd.userErrors.map((e: any) => e.message).join(', '));
  }
}

export async function removeOrderTag(orderId: string, tag: string) {
  const m = `
    mutation TagsRemove($id: ID!, $tags: [String!]!) {
      tagsRemove(id: $id, tags: $tags) {
        node { id }
        userErrors { field message }
      }
    }
  `;
  const data = await shopifyAdminFetch<{ tagsRemove: any }>(m, { id: orderId, tags: [tag] });
  if (data.tagsRemove.userErrors?.length) {
    throw new Error(data.tagsRemove.userErrors.map((e: any) => e.message).join(', '));
  }
}

export async function tagCustomer(customerId: string, tags: string[]) {
  const id = customerId.startsWith("gid://")
    ? customerId
    : `gid://shopify/Customer/${customerId}`;
  const m = `
    mutation TagsAdd($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        node { id }
        userErrors { field message }
      }
    }
  `;
  const data = await shopifyAdminFetch<{ tagsAdd: any }>(m, { id, tags });
  if (data.tagsAdd.userErrors?.length) {
    throw new Error(data.tagsAdd.userErrors.map((e: any) => e.message).join(", "));
  }
}

// ── Loyalty (Amneh Rewards) ────────────────────────────────────────────────

function toCustomerGid(id: string) {
  return id.startsWith("gid://") ? id : `gid://shopify/Customer/${id}`;
}

export interface LoyaltyRewardCode {
  threshold: number;
  discountPct: number;
  code: string;
  expiresAt: string;
}

export interface CustomerLoyalty {
  points: number;
  claimedRewards: number[];
  welcomeGiven: boolean;
  processedOrders: string[];
  rewardCodes: LoyaltyRewardCode[];
}

export async function getCustomerLoyalty(
  customerId: string,
): Promise<CustomerLoyalty> {
  const id = toCustomerGid(customerId);
  const q = `
    query Loyalty($id: ID!) {
      customer(id: $id) {
        points: metafield(namespace: "loyalty", key: "points") { value }
        claimed: metafield(namespace: "loyalty", key: "claimed_rewards") { value }
        welcome: metafield(namespace: "loyalty", key: "welcome_given") { value }
        processed: metafield(namespace: "loyalty", key: "processed_orders") { value }
        codes: metafield(namespace: "loyalty", key: "reward_codes") { value }
      }
    }
  `;
  const data = await shopifyAdminFetch<{ customer: any }>(q, { id });
  const c = data.customer ?? {};
  const parseArray = (v: any) => {
    try {
      return v?.value ? JSON.parse(v.value) : [];
    } catch {
      return [];
    }
  };
  return {
    points: parseInt(c.points?.value ?? "0", 10) || 0,
    claimedRewards: parseArray(c.claimed),
    welcomeGiven: c.welcome?.value === "true",
    processedOrders: parseArray(c.processed),
    rewardCodes: parseArray(c.codes),
  };
}

export async function setCustomerLoyalty(
  customerId: string,
  fields: Partial<CustomerLoyalty>,
) {
  const ownerId = toCustomerGid(customerId);
  const metafields: Record<string, unknown>[] = [];
  const push = (key: string, type: string, value: string) =>
    metafields.push({ ownerId, namespace: "loyalty", key, type, value });

  if (fields.points !== undefined)
    push("points", "number_integer", String(fields.points));
  if (fields.claimedRewards !== undefined)
    push("claimed_rewards", "json", JSON.stringify(fields.claimedRewards));
  if (fields.welcomeGiven !== undefined)
    push("welcome_given", "boolean", fields.welcomeGiven ? "true" : "false");
  if (fields.processedOrders !== undefined)
    push("processed_orders", "json", JSON.stringify(fields.processedOrders));
  if (fields.rewardCodes !== undefined)
    push("reward_codes", "json", JSON.stringify(fields.rewardCodes));

  if (!metafields.length) return;

  const mutation = `
    mutation SetLoyalty($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors { field message }
      }
    }
  `;
  const data = await shopifyAdminFetch<{ metafieldsSet: any }>(mutation, {
    metafields,
  });
  if (data.metafieldsSet.userErrors.length)
    throw new Error(
      data.metafieldsSet.userErrors.map((u: any) => u.message).join(", "),
    );
}

/** Creates a single-use, customer-locked, 30-day percentage discount code. */
export async function createLoyaltyDiscountCode(
  customerId: string,
  discountPct: number,
): Promise<LoyaltyRewardCode & { threshold: number }> {
  const ownerId = toCustomerGid(customerId);
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  const code = `AMNEH${discountPct}-${suffix}`;
  const now = new Date();
  const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const mutation = `
    mutation CreateLoyaltyCode($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode { id }
        userErrors { field message }
      }
    }
  `;
  const basicCodeDiscount = {
    title: `Amneh Rewards ${discountPct}% – ${code}`,
    code,
    startsAt: now.toISOString(),
    endsAt: endsAt.toISOString(),
    customerSelection: { customers: { add: [ownerId] } },
    customerGets: {
      value: { percentage: discountPct / 100 },
      items: { all: true },
    },
    appliesOncePerCustomer: true,
    usageLimit: 1,
    // Do not stack with the store-wide automatic discount.
    combinesWith: {
      orderDiscounts: false,
      productDiscounts: false,
      shippingDiscounts: false,
    },
  };

  const data = await shopifyAdminFetch<{ discountCodeBasicCreate: any }>(
    mutation,
    { basicCodeDiscount },
  );
  const errs = data.discountCodeBasicCreate.userErrors;
  if (errs?.length)
    throw new Error(errs.map((e: any) => e.message).join(", "));

  return { threshold: 0, discountPct, code, expiresAt: endsAt.toISOString() };
}

/**
 * Idempotently awards loyalty points for an order and mints discount codes for
 * any reward thresholds newly crossed. Safe to call more than once for the same
 * order (e.g. WhatsApp confirm + orders/paid) — the processed_orders list
 * guarantees points are credited at most once. Looks up the order's customer
 * and subtotal itself, so callers only need the order id (numeric or gid).
 * Returns whether points were newly awarded, the new balance, and any reward
 * codes minted by THIS call (so callers can notify the customer).
 */
export async function awardLoyaltyForOrder(
  orderId: string,
): Promise<{ awarded: boolean; points: number; newCodes: LoyaltyRewardCode[] }> {
  const orderGid = orderId.startsWith("gid://")
    ? orderId
    : `gid://shopify/Order/${orderId}`;

  const q = `
    query OrderLoyalty($id: ID!) {
      order(id: $id) {
        id
        customer { id }
        subtotalPriceSet { shopMoney { amount } }
      }
    }
  `;
  const data = await shopifyAdminFetch<{ order: any }>(q, { id: orderGid });
  const order = data.order;
  if (!order) return { awarded: false, points: 0, newCodes: [] };

  const customerId = order.customer?.id;
  if (!customerId) return { awarded: false, points: 0, newCodes: [] }; // guest — no account

  const loyalty = await getCustomerLoyalty(customerId);
  if (loyalty.processedOrders.includes(orderGid))
    return { awarded: false, points: loyalty.points, newCodes: [] }; // already counted

  const subtotal = parseFloat(order.subtotalPriceSet?.shopMoney?.amount ?? "0");
  const qualifies = subtotal >= MIN_ORDER_VALUE;

  let points = loyalty.points;
  if (qualifies) points += POINTS_PER_ORDER;

  const processedOrders = [...loyalty.processedOrders, orderGid];
  const claimedRewards = [...loyalty.claimedRewards];
  const rewardCodes = [...loyalty.rewardCodes];
  const newCodes: LoyaltyRewardCode[] = [];

  for (const reward of REWARDS) {
    if (points >= reward.points && !claimedRewards.includes(reward.points)) {
      try {
        const minted = await createLoyaltyDiscountCode(customerId, reward.discountPct);
        const code: LoyaltyRewardCode = {
          threshold: reward.points,
          discountPct: reward.discountPct,
          code: minted.code,
          expiresAt: minted.expiresAt,
        };
        rewardCodes.push(code);
        newCodes.push(code);
        claimedRewards.push(reward.points);
      } catch (err) {
        console.error("[Loyalty] Failed to mint discount code:", err);
      }
    }
  }

  // Record the order as processed even when it doesn't qualify, so a re-fire
  // (e.g. a second WhatsApp reply) never re-evaluates it.
  await setCustomerLoyalty(customerId, {
    points,
    processedOrders,
    claimedRewards,
    rewardCodes,
  });
  return { awarded: qualifies, points, newCodes };
}

export async function cancelShopifyOrder(shopifyId: string) {
  const gid = shopifyId.startsWith('gid://')
    ? shopifyId
    : `gid://shopify/Order/${shopifyId}`;

  const mutation = `
    mutation CancelOrder($orderId: ID!) {
      orderCancel(
        orderId: $orderId
        reason: CUSTOMER
        notifyCustomer: true
        refund: false
        restock: true
      ) {
        job { id }
        orderCancelUserErrors { code field message }
      }
    }
  `;

  const data = await shopifyAdminFetch<{ orderCancel: any }>(mutation, { orderId: gid });

  if (data.orderCancel.orderCancelUserErrors?.length) {
    const msg = data.orderCancel.orderCancelUserErrors
      .map((e: any) => e.message)
      .join(', ');
    throw new Error(`Order cancel failed: ${msg}`);
  }

  return data.orderCancel;
}

export default {
  getCustomerByEmail,
  createCustomer,
  sendCustomerInvite,
  getCustomerLoyalty,
  setCustomerLoyalty,
  createLoyaltyDiscountCode,
  setCustomerPasswordHash,
  verifyCustomerPasswordByEmail,
  ensureCustomerForGoogle,
  tagCustomer,
  cancelShopifyOrder,
  findOrderByPhone,
  findOrderByMessageSid,
  waSidTag,
  addOrderTag,
  removeOrderTag,
};
