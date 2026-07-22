// Tiny client-side wrapper around the Meta Pixel (window.fbq).
// No-ops safely if the pixel isn't loaded (env not set / blocked).
import { phCapture } from "@/lib/posthog";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Funnel events also forwarded to PostHog so its dashboard can build the same
// ProductView → AddToCart → InitiateCheckout funnel and let you watch the
// replays of shoppers who drop at each step. "PageView" is intentionally
// excluded — PostHog fires its own $pageview in components/PostHog.tsx, so
// forwarding it here would double-count. Purchase isn't in this list because
// it fires from Shopify's checkout (offsite), which no on-site tool can see.
const PH_FORWARD: Record<string, string> = {
  ViewContent: "product_viewed",
  AddToCart: "add_to_cart",
  InitiateCheckout: "initiate_checkout",
  Contact: "whatsapp_contact",
};

// Storefront funnel events that also get a server-side twin via the Meta
// Conversions API (see lib/meta-capi.ts + /api/meta/capi). Pixel + CAPI share
// one event_id so Meta deduplicates them — this is what lifts "event coverage"
// in Events Manager. Purchase is intentionally absent (Shopify sends it).
const CAPI_EVENTS = new Set(["ViewContent", "AddToCart", "InitiateCheckout"]);

// Best-effort unique id shared between the pixel event and its CAPI twin.
function newEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function fbTrack(event: string, params?: Record<string, unknown>): void {
  const capi = CAPI_EVENTS.has(event);
  // Generate one id up front so the pixel's eventID matches the CAPI event_id.
  const eventId = capi ? newEventId() : undefined;

  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    if (eventId) {
      window.fbq("track", event, params, { eventID: eventId });
    } else {
      window.fbq("track", event, params);
    }
  }

  const phEvent = PH_FORWARD[event];
  if (phEvent) phCapture(phEvent, params);

  // Fire the server twin. keepalive: this often runs right before a navigation
  // to Shopify checkout (InitiateCheckout / Buy Now), and keepalive lets the
  // request complete after the page starts unloading. Never awaited, never
  // throws to the caller.
  if (capi && eventId && typeof window !== "undefined") {
    try {
      fetch("/api/meta/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          eventName: event,
          eventId,
          eventSourceUrl: window.location.href,
          customData: params,
        }),
      }).catch(() => {});
    } catch {
      /* never let telemetry break the funnel */
    }
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Manual Advanced Matching — lets Meta connect a pixel event to a real
// person via email/phone/name instead of relying purely on cookies (which
// Safari/iOS/ad blockers often block). Meta's pixel script hashes these
// values (SHA-256) client-side before sending anything over the network —
// we never hash or send raw PII ourselves.
//
// Call this the moment a visitor tells us who they are (typing an email into
// a login/signup form, being identified as a logged-in user) — never
// hardcode a fixed value; only ever pass what that visitor just provided.
export function fbSetAdvancedMatching(data: { em?: string; ph?: string; fn?: string; ln?: string }): void {
  if (!PIXEL_ID || typeof window === "undefined") return;
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => !!v));
  if (Object.keys(clean).length === 0) return;

  // window.fbq is defined synchronously by the base pixel <Script> in
  // MetaPixel.tsx, but that script's execution order relative to callers
  // isn't guaranteed — poll briefly instead of assuming it's ready.
  let attempts = 0;
  const tryInit = () => {
    if (typeof window.fbq === "function") {
      window.fbq("init", PIXEL_ID, clean);
    } else if (attempts++ < 40) {
      setTimeout(tryInit, 75);
    }
  };
  tryInit();
}
