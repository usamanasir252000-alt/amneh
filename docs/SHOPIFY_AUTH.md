## Overview

This project uses Shopify Customers as the single source of truth for user accounts. The server uses the Shopify Admin GraphQL API to create, search, and update customers. No local database is required for authentication.

## Required environment variables

- `SHOPIFY_STORE` or `SHOPIFY_STORE_DOMAIN` — your shop domain (e.g. `my-store.myshopify.com`)
- `SHOPIFY_ADMIN_API_ACCESS_TOKEN` or `SHOPIFY_AUTH_APP_TOKEN` — Admin API access token for your custom app (server-side only)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — for Google OAuth on the web client
- `JWT_SECRET` — HMAC secret used to sign session JWTs

## How it works

- Email signup: creates a Shopify Customer and stores a bcrypt hash of the password in a customer metafield `namespace: auth`, `key: passwordHash`. The server issues a JWT session containing the Shopify Customer ID.
- Email login: server fetches the customer by email, reads the metafield, verifies bcrypt password, and issues JWT session.
- Google login: client obtains an `id_token` from Google, sends it to `/api/auth/google`. Server verifies the token with Google, finds or creates the Shopify customer, and issues JWT session.

## Security notes & recommendations

- Metafields are accessible via the Admin API — keep your Admin API access token secret and rotate regularly.
- Storing password hashes in metafields is functional but not ideal. Recommended alternatives:
  - Use an external authentication provider (Auth0, Clerk, NextAuth with external DB) and link customers to Shopify via customer ID.
  - Use Shopify Multipass (for Shopify Plus merchants) or a dedicated identity provider.
- Always use HTTPS and set the `session` cookie with `HttpOnly`, `Secure` (production), and `SameSite=Lax`.

## Integration notes

- Client-side Google flow: obtain `id_token` from Google Sign-In and POST it to `/api/auth/google`.
- Client-side email flows: POST credentials to `/api/auth/register` and `/api/auth/login`.
- Check session on the client by calling `/api/auth/me`.

## Files added

- `lib/shopify-admin.ts` — Shopify Admin GraphQL client and customer helpers
- `lib/jwt.ts` — JWT sign/verify helpers (uses `jose`)
- `app/api/auth/register/route.ts` — signup (Shopify customer create)
- `app/api/auth/login/route.ts` — login (Shopify metafield password verify)
- `app/api/auth/google/route.ts` — Google sign-in handler
- `app/api/auth/me/route.ts` — current session

## Testing & deployment

1. Set env variables (never commit secrets).
2. Install deps: `npm install` (or `pnpm`/`yarn`).
3. Run `npm run dev` and test flows.
