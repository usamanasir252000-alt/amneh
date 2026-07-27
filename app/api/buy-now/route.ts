import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { createCart, linkCartToCustomer, CartBuyerIdentityInput } from "@/lib/shopify";
import { captureServerException, captureServerEvent, distinctIdFromCookie } from "@/lib/posthog-server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const startedAt = Date.now();
  const { variantId, quantity, discountCodes, prewarm } = await req.json();
  const isPrewarm = prewarm === true;
  console.log("[buy-now] received:", JSON.stringify({ variantId, quantity, discountCodes, prewarm: isPrewarm }));

  // Bundle discount codes (%-off + free-shipping) — only forward valid strings.
  const codes = Array.isArray(discountCodes)
    ? discountCodes.filter((c: unknown): c is string => typeof c === "string" && c.trim().length > 0)
    : [];

  // Distinct id from the PostHog cookie, so a failed checkout is attributed to
  // the SAME shopper/session (and replay) as their on-site activity.
  const phDistinctId = distinctIdFromCookie(req.headers.get("cookie"));

  let cart;
  try {
    cart = await createCart(variantId, quantity ?? 1, codes);
  } catch (err) {
    console.error("[buy-now] createCart failed:", JSON.stringify({ variantId, quantity, prewarm: isPrewarm, elapsedMs: Date.now() - startedAt, error: (err as Error)?.message }));
    // Surface checkout-blocking failures in PostHog. This is the moment a
    // high-intent shopper clicked Buy Now and got nothing — a directly
    // measurable, attributable lost sale, not a guess. A failed background
    // prewarm is NOT a lost sale (the click falls back to a live call), so
    // it's flagged so dashboards can exclude it.
    await captureServerEvent("checkout_cart_failed", {
      variantId, quantity: quantity ?? 1, elapsedMs: Date.now() - startedAt, reason: (err as Error)?.message, prewarm: isPrewarm,
    }, phDistinctId);
    await captureServerException(err, phDistinctId, { route: "buy-now", stage: "createCart", variantId });
    return NextResponse.json({ error: "Could not create cart" }, { status: 502 });
  }

  // Buyer's real IP — required by Shopify to carry the logged-in session into
  // checkout on server-side calls (see Shopify-Storefront-Buyer-IP header).
  const buyerIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    undefined;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  // (Meta _fbp/_fbc cart-attribute stashing used to run here to feed our own
  // CAPI Purchase — removed. Shopify's native Meta integration now handles
  // attribution at checkout, so there's nothing to stash.)

  // Only logged-in buyers need the extra round-trip: it swaps in the
  // authenticated checkoutUrl so they land on checkout already signed in.
  // Anonymous buyers (most ad traffic) skip it and redirect immediately.
  //
  // Capped at 4s via Promise.race — linkCartToCustomer() calls shopifyFetch,
  // which has its own 8s timeout, and createCart() above already spent up to
  // 8s of its own. Uncapped, a logged-in buyer could wait ~16s of pure API
  // latency before the browser even starts navigating to Shopify checkout —
  // this is what was surfacing as "checkout sometimes takes 10-15+ seconds
  // to load." A slow/timed-out link attempt now always falls back to the
  // guest checkoutUrl already set above rather than blocking the redirect.
  let checkoutUrl = cart.checkoutUrl;
  if (sessionToken) {
    try {
      const payload = await verifyToken(sessionToken);
      // Pass ONLY the token when present — adding `email` alongside it makes
      // Shopify treat the buyer as a guest and breaks logged-in checkout.
      const buyerIdentity: CartBuyerIdentityInput | null = payload.shopifyToken
        ? { customerAccessToken: payload.shopifyToken as string }
        : payload.email
        ? { email: payload.email as string }
        : null;
      if (buyerIdentity) {
        const linked = await Promise.race([
          linkCartToCustomer(cart.id, buyerIdentity, buyerIp),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("link-timeout")), 4000)),
        ]);
        checkoutUrl = linked.checkoutUrl || cart.checkoutUrl;
      }
    } catch {
      // Timed out or failed — fall back to the guest checkoutUrl already set above.
    }
  }

  console.log("[buy-now] success:", JSON.stringify({ variantId, cartId: cart.id, elapsedMs: Date.now() - startedAt }));
  return NextResponse.json({ checkoutUrl });
}
