import { NextResponse, after } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { createCart, linkCartToCustomer, setCartAttributes, CartBuyerIdentityInput } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const startedAt = Date.now();
  const { variantId, quantity, discountCodes } = await req.json();
  console.log("[buy-now] received:", JSON.stringify({ variantId, quantity, discountCodes }));

  // Bundle discount codes (%-off + free-shipping) — only forward valid strings.
  const codes = Array.isArray(discountCodes)
    ? discountCodes.filter((c: unknown): c is string => typeof c === "string" && c.trim().length > 0)
    : [];

  let cart;
  try {
    cart = await createCart(variantId, quantity ?? 1, codes);
  } catch (err) {
    console.error("[buy-now] createCart failed:", JSON.stringify({ variantId, quantity, elapsedMs: Date.now() - startedAt, error: (err as Error)?.message }));
    return NextResponse.json({ error: "Could not create cart" }, { status: 502 });
  }

  // Buyer's real IP — required by Shopify to carry the logged-in session into
  // checkout on server-side calls (see Shopify-Storefront-Buyer-IP header).
  const buyerIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    undefined;

  const cookieStore = await cookies();
  const ua = req.headers.get("user-agent") || undefined;
  const sessionToken = cookieStore.get("session")?.value;

  // Meta attribution tagging never affects which checkoutUrl to send the
  // buyer to, so it must never block the redirect. Scheduled via after() —
  // NOT a bare fire-and-forget promise — because Vercel can freeze/kill the
  // function the instant the response is sent, which aborts any in-flight
  // fetch that isn't explicitly kept alive (this was surfacing as
  // "[meta attrs] failed to store on cart: AbortError").
  after(async () => {
    try {
      const attrs: { key: string; value: string }[] = [];
      const fbp = cookieStore.get("_fbp")?.value;
      const fbc = cookieStore.get("_fbc")?.value;
      if (fbp) attrs.push({ key: "_fbp", value: fbp });
      if (fbc) attrs.push({ key: "_fbc", value: fbc });
      if (buyerIp) attrs.push({ key: "_fb_ip", value: buyerIp });
      if (ua) attrs.push({ key: "_fb_ua", value: ua });
      if (attrs.length) await setCartAttributes(cart.id, attrs);
    } catch (err) {
      console.error("[meta attrs] failed to store on cart (buy-now):", err);
    }
  });

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
