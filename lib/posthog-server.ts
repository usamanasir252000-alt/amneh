// ── Server-side PostHog (posthog-node) ──────────────────────────────────────
// Separate from lib/posthog.ts (which is the browser SDK). This runs in API
// routes / instrumentation to record SERVER errors — most importantly the
// Shopify calls behind checkout (createCart in the buy-now route). Those
// failures currently only hit the server console; here they become visible in
// PostHog so a spike in "cart creation failed" is something you can SEE tied to
// lost checkouts, not guess at.
//
// Uses the *Immediate* capture variants, which await the network send — required
// on serverless (Vercel/Netlify), where the function can freeze the moment the
// response is returned and drop a fire-and-forget event.
import { PostHog } from "posthog-node";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let instance: PostHog | null = null;

function client(): PostHog | null {
  if (!KEY) return null; // no-op until the project key is set (same as client SDK)
  if (!instance) {
    instance = new PostHog(KEY, { host: HOST, flushAt: 1, flushInterval: 0 });
  }
  return instance;
}

/** Report a server-side exception to PostHog Error Tracking. Never throws. */
export async function captureServerException(
  error: unknown,
  distinctId?: string,
  props?: Record<string, unknown>,
): Promise<void> {
  const ph = client();
  if (!ph) return;
  try {
    await ph.captureExceptionImmediate(error, distinctId, props);
  } catch {
    /* telemetry must never break the request */
  }
}

/** Capture a named server-side event (e.g. checkout_cart_failed). Never throws. */
export async function captureServerEvent(
  event: string,
  props?: Record<string, unknown>,
  distinctId?: string,
): Promise<void> {
  const ph = client();
  if (!ph) return;
  try {
    await ph.captureImmediate({ distinctId: distinctId || "server", event, properties: props });
  } catch {
    /* no-op */
  }
}

/**
 * Pull the visitor's PostHog distinct_id out of the `ph_<key>_posthog` cookie,
 * so a server error/event stitches onto the SAME person/session as their
 * browser activity and replay — instead of showing up as an anonymous
 * "server" actor. Returns undefined when the cookie is absent or unparseable.
 */
export function distinctIdFromCookie(cookieHeader?: string | string[] | null): string | undefined {
  if (!cookieHeader) return undefined;
  const str = Array.isArray(cookieHeader) ? cookieHeader.join("; ") : cookieHeader;
  const match = str.match(/ph_phc_.*?_posthog=([^;]+)/);
  if (!match?.[1]) return undefined;
  try {
    const data = JSON.parse(decodeURIComponent(match[1]));
    return typeof data?.distinct_id === "string" ? data.distinct_id : undefined;
  } catch {
    return undefined;
  }
}
