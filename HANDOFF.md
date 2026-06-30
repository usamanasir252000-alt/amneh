# Amneh — Project Handoff & Context

Handoff doc summarizing the architecture and all the work done in the most recent
working session. Written for a developer/account taking over. **No secret values
are included — only env-var names.**

---

## 1. What Amneh is

- **Brand:** `amneh.` — a Pakistani DTC skincare brand (serums etc.). Mobile-first, **COD-heavy** (Cash on Delivery + Bank Deposit). Prices in **PKR**.
- **Stack:** **Headless** — custom **Next.js (App Router)** storefront on **Vercel**, with **Shopify** as the backend/checkout.
  - Custom storefront domain: **`amnehofficial.com`** / `www` → Vercel.
  - Shopify online store/checkout: **`shop.amnehofficial.com`** → Shopify.
- **Order flow:** Shopify COD checkout → order created → **WhatsApp confirm/cancel** prompt (Twilio) → fulfilled via **Leopards** courier.
- **Other:** loyalty/rewards system, Google login, Judge.me reviews, Cloudinary images.

## 2. Critical architecture facts (read first)

- **Production branch is `staging`** (Vercel deploys `staging`, **not** `master`). `master` is behind. Pushing to `staging` deploys to production.
- **DNS is at GoDaddy** (nameservers `ns##.domaincontrol.com`). `www`/apex → Vercel; `shop` → Shopify.
- **Shopify customer accounts = NEW customer accounts** (account URL `shopify.com/{id}/account`). Cannot switch to classic. This affects logged-in checkout (see §3a).
- **Shopify Admin API auth:** `lib/shopify-admin.ts` uses a **client-credentials grant** with `AUTH_CLIENT_ID` / `AUTH_CLIENT_SECRET`. Token scopes seen: **`write_customers`, `write_orders`** (NOT `write_products`). ⚠️ These two env vars were resolving from the **shell environment locally**, and are **not in `.env`** — they **must** be set in Vercel or the Admin API fails in prod.
- `SHOPIFY_ADMIN_ACCESS_TOKEN` exists in `.env` but is **unused dead config** (nothing reads it).
- **Shopify order tags are capped at 40 characters** (products/customers get 255). This bit us — see §3c.
- **Storefront API** = catalog/cart (`lib/shopify.ts`). **Admin API** = orders/customers/loyalty (`lib/shopify-admin.ts`).
- Product metafields use namespace **`custom`** (Storefront-exposed). Keys: `ingredients`, `how_to_use`, `benefits`, `patch_test`, `when_to_use`.

## 3. Work done this session

### 3a. Logged-in checkout ("Sign in" showing for logged-in users)
- Custom email/password (and Google) login stores the Shopify **customerAccessToken** inside the session JWT.
- On **new customer accounts**, to carry the logged-in session into Shopify checkout you must, on **server-side** Storefront calls: (1) put `customerAccessToken` in the cart's `buyerIdentity`, (2) send the **`Shopify-Storefront-Buyer-IP`** header, (3) request the `checkoutUrl` at navigation time.
- **Do NOT send `email` alongside `customerAccessToken`** in buyerIdentity — it makes Shopify treat the buyer as a guest and breaks logged-in checkout.
- Files: `lib/shopify.ts` (`shopifyFetch` adds buyer-IP header + timeout; `linkCartToCustomer` returns fresh `checkoutUrl`; `setCartAttributes`), `app/api/cart/route.ts` (`link` action), `app/api/buy-now/route.ts`, `context/CartContext.tsx` (`goToCheckout`).

### 3b. Checkout "loads forever" hang
- `shopifyFetch` had no timeout → a slow Shopify call hung the request and the checkout redirect. Added an **8s AbortController timeout**.
- `goToCheckout` now races the link call against a **4s timeout** so linking can never block the redirect (falls back to cached checkout URL).

### 3c. WhatsApp confirm/cancel order flow
- **`app/api/webhooks/shopify/route.ts`** (orders/create topic): tags order `wa-pending`, sends the WhatsApp prompt (Twilio Content template w/ quick-reply buttons), and stamps a **`wasid<TwilioMessageSID>`** tag on the order.
- **`app/api/webhooks/whatsapp/route.ts`** (inbound reply): `CONFIRM` → `wa-confirmed` (+ fires Meta Purchase, see §3f); `CANCEL` → `cancelShopifyOrder` + `wa-cancelled`.
- Fixes made:
  - **Don't claim success on failure** — confirm/cancel only send the success reply if the Shopify action actually succeeded (cancel runs the action first).
  - **Order selection** (`findOrderByPhone`) targets the **most recent** order (previously skipped cancelled orders → confirmed an older one).
  - **Multi-order disambiguation:** Twilio's inbound webhook includes **`OriginalRepliedMessageSid`** (the SID of the message whose button was tapped). We store that SID as the `wasid<SID>` order tag at send time, then `findOrderByMessageSid` resolves the exact order on reply.
  - ⚠️ **Order tag 40-char limit:** the prefix had to be short — `wasid` + 34-char Twilio SID = 39 chars. The original `wa-sid-` prefix made it 41 → Shopify rejected it with `Order tags is invalid` and the tag silently never got written.
  - ⚠️ **Twilio Content-template variables cannot contain newlines/tabs/4+ spaces** (error **21656**). The items list now joins with `", "` (not `\n`), and `sanitizeVar()` cleans every variable. This was silently breaking the WhatsApp prompt for **any order with 2+ items** (→ customer couldn't confirm → no Purchase sent to Meta).
- `cancelShopifyOrder` uses `orderCancel(reason: CUSTOMER, notifyCustomer: true, refund: false, restock: true)`. **`notifyCustomer` only emails if the order has an email** (relevant for COD phone-only orders).

### 3d. Email deliverability (Gmail "suspicious / images hidden")
- Root cause: the sending domain wasn't authenticated. **Fixed** — Shopify Settings → Notifications → Sender email `noreply@amnehofficial.com` → **Email domain authentication = Authenticated** (DKIM CNAMEs `x3p._domainkey`, `x3p2._domainkey`, etc. added at GoDaddy; verified live).
- SPF intentionally absent (Shopify authenticates via DKIM; DMARC passes on DKIM alignment). DMARC exists (`p=none`).
- Remaining: it's a **new-sender reputation** warm-up; old pre-auth emails keep the banner. Improves over ~2–4 weeks of legit sending.

### 3e. Product detail page content (`app/products/[id]/page.tsx`)
- Added two metafield-driven sections (namespace `custom`, single-product query in `lib/shopify.ts`):
  - **Patch Test** → `custom.patch_test` (multi-line text), rendered via `FormattedText` (supports `1)` numbered steps + `*bold*`).
  - **When to Use** → `custom.when_to_use` (single-line text; values **`Morning & Night` / `Morning` / `Night`**), rendered via `WhenToUse` component showing sun/moon icons.
- **Layout:** Ingredients, How to Use, When to Use are **always-visible** sections; **Patch Test, Key Benefits, Shipping & Returns** are **dropdown accordions**.
- **No Returns policy** stated (framed as hygiene/safety). **All "free delivery / free over PKR 3,000" copy removed** — there is **no free delivery**; shipping is **PKR 200 flat rate**.
- `components/PromoSection.tsx` is **unused dead code** (placeholder "$55 free beauty bag" in USD) — not rendered anywhere; safe to delete.
- ⚠️ Metafield definitions must be created in Shopify (Settings → Custom data → Products): `custom.patch_test` (multi-line) and `custom.when_to_use` (single-line), with **Storefront access enabled**, then filled per product.

### 3f. Meta Pixel + Conversions API (CAPI) — the big build
Goal: maximize ROAS with **COD-quality optimization** (only confirmed orders count as conversions).

- **Meta assets:** business portfolio **"Amneh"** (`business_id 1333228054808048`), dataset **"Amneh Web"**, **Pixel ID `2034071033860780`**.
- **Env vars:** `NEXT_PUBLIC_META_PIXEL_ID=2034071033860780`, `META_CAPI_ACCESS_TOKEN` (secret, in Vercel), `META_TEST_EVENT_CODE` (set only while testing — **must be removed in prod**).
- **Browser pixel:** `lib/fbpixel.ts` (`fbTrack`), `components/MetaPixel.tsx` (base script + PageView on route change, in `app/layout.tsx`). Events:
  - `ViewContent` — product page
  - `AddToCart` — cart add **and** Buy Now
  - `InitiateCheckout` — checkout **and** Buy Now
  - (Buy Now fires **both** AddToCart + InitiateCheckout so those high-intent shoppers aren't missed.)
- **Server CAPI (the money event):** `lib/meta.ts` `sendMetaPurchase()` — fires **`Purchase` ONLY when an order is `wa-confirmed` on WhatsApp** (COD-quality). Hashes email/phone, includes `fbp/fbc/client IP/user agent`, `event_id = purchase_<orderId>` (idempotent).
  - `_fbp`, `_fbc`, client IP, user agent are captured at checkout (cart `link` / buy-now) and stored as **cart attributes** via `setCartAttributes` → persist to `order.customAttributes`.
  - `getOrderConversionData()` in `lib/shopify-admin.ts` reads value/currency/email/phone (incl. shipping/billing address phone) + those attributes for the Purchase event.
- **Domain verification:** done via **DNS TXT** at GoDaddy on the **root** domain (`facebook-domain-verification=...` — value `26zvn4y4w017s33pdknb6ky5fbh21v`). Note: the asset must be the **root** `amnehofficial.com`, not `www` (www is a CNAME to Vercel and can't hold a TXT). A `facebook-domain-verification` meta tag also exists in `app/layout.tsx` metadata as backup.
- **Verified working** end-to-end: browser events + server-side confirmed-order Purchase (matched on email/fbp/IP/UA) in Events Manager Test Events.

### 3g. Ads strategy (advice given — no code)
- **Budget: ~PKR 60k/month Meta (~PKR 2,000/day).** Structure: **1 campaign → 1 ad set → 3–5 creatives.** Don't split the budget across campaigns/ad sets (starves learning).
- **Manual Sales campaign**, optimize for **Add to Cart** at launch.
- **Ladder (signal-triggered, not calendar-locked):** Add to Cart → Initiate Checkout → **Purchase**. Climb when each rung has volume + a winning creative; race to Purchase as soon as sales come. Each switch resets learning once.
- **TikTok:** don't run concurrently on a thin budget — sequence (prove Meta first). 30k/mo is below TikTok's daily minimums for conversion ads.
- **Creative is the #1 ROAS lever.** Measure **net ROAS** (after COD cancellations + delivery + COGS), not Meta's surface number.

## 4. Outstanding / next steps

- [ ] **Remove `META_TEST_EVENT_CODE` from Vercel + redeploy** so confirmed-order Purchases log as **real** conversions (not test). (Already removed from local `.env`; verify on Vercel.)
- [ ] Confirm the latest **Vercel deploy of `staging`** went through (all the content/code fixes above).
- [ ] Create Shopify metafield definitions **`custom.patch_test`** and **`custom.when_to_use`** (Storefront access on) and fill them per product.
- [ ] Update the **`/returns` policy page** content to state no-returns (linked from product page).
- [ ] (Optional) delete unused `components/PromoSection.tsx`.
- [ ] Create the **Meta campaign** (§3g) + produce 3–5 launch creatives.
- [ ] Email **reputation warm-up** continues passively.

## 5. Env vars (names only — get values from Vercel/owner)

`SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`,
`AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET` (Shopify Admin client-credentials — **must be in Vercel**),
`JWT_SECRET`, `DATABASE_URL`,
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_CONTENT_SID`, `TWILIO_CONTENT_SID_DETAILED`,
`NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, (`META_TEST_EVENT_CODE` — testing only),
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`,
`NEXT_PUBLIC_GOOGLE_CLIENT_SECRET`, `JUDGEME_PUBLIC_TOKEN`, `JUDGEME_PRIVATE_TOKEN`, `JUDGEME_SHOP_DOMAIN`,
`ADMIN_PASSWORD`. (`SHOPIFY_ADMIN_ACCESS_TOKEN` present but unused.)

## 6. Conventions / gotchas

- **Git:** production = `staging` branch. Commit messages should have **no AI co-author/attribution**. Don't commit without being asked.
- Order tags ≤ **40 chars**.
- Twilio Content-template variables: **no newlines/tabs/4+ spaces**.
- Meta Purchase = **WhatsApp-confirmed only** (intentional COD-quality design); cancels/unconfirmed send nothing.
- New customer accounts: logged-in checkout requires the buyer-IP header (§3a).
