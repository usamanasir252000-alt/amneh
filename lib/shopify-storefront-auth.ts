const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;
const API_VERSION = "2024-04";

async function storefrontFetch<T>(
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
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

export interface ShopifyCustomerToken {
  accessToken: string;
  expiresAt: string;
}

export interface ShopifyCustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export async function registerCustomer(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}): Promise<ShopifyCustomerProfile> {
  const data = await storefrontFetch<{
    customerCreate: {
      customer: ShopifyCustomerProfile | null;
      customerUserErrors: { code: string; message: string }[];
    };
  }>(
    `
    mutation CustomerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id email firstName lastName }
        customerUserErrors { code message }
      }
    }
  `,
    {
      input: {
        email: payload.email,
        password: payload.password,
        firstName: payload.firstName,
        lastName: payload.lastName ?? "",
      },
    }
  );

  if (data.customerCreate.customerUserErrors.length) {
    throw new Error(data.customerCreate.customerUserErrors[0].message);
  }
  return data.customerCreate.customer!;
}

export async function loginCustomer(
  email: string,
  password: string
): Promise<{ token: ShopifyCustomerToken; customer: ShopifyCustomerProfile }> {
  // Step 1: get access token
  const tokenData = await storefrontFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: ShopifyCustomerToken | null;
      customerUserErrors: { code: string; message: string }[];
    };
  }>(
    `
    mutation CustomerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code message }
      }
    }
  `,
    { input: { email, password } }
  );

  if (tokenData.customerAccessTokenCreate.customerUserErrors.length) {
    throw new Error(
      tokenData.customerAccessTokenCreate.customerUserErrors[0].message
    );
  }
  const token = tokenData.customerAccessTokenCreate.customerAccessToken!;

  // Step 2: fetch customer profile with the token
  const profileData = await storefrontFetch<{
    customer: ShopifyCustomerProfile | null;
  }>(
    `
    query GetCustomer($token: String!) {
      customer(customerAccessToken: $token) {
        id email firstName lastName
      }
    }
  `,
    { token: token.accessToken }
  );

  if (!profileData.customer) throw new Error("Could not fetch customer profile");
  return { token, customer: profileData.customer };
}
