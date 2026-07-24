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

// ── First-party match identifiers for the server twin ───────────────────────
// The CAPI route used to read _fbp/_fbc straight from the request cookies, but
// on a cold ad landing the Meta base pixel (afterInteractive) usually hasn't
// written those cookies yet when ViewContent fires — that race is why Events
// Manager showed only ~30% fbp/fbc coverage and dragged Event Match Quality to
// 4.1. So we resolve them HERE, on the client, and send them in the CAPI body.
// We also persist them as cookies: the Meta pixel reuses an existing _fbp/_fbc,
// so the pixel event and its server twin end up carrying the SAME value.

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

// _fbp — Meta's browser id. Format: fb.1.<created_ms>.<random>. If the pixel
// hasn't set it yet we create a spec-compliant value; the pixel then reuses it,
// so pixel and CAPI stay in sync. 90-day lifetime matches Meta's own cookie.
function ensureFbp(): string | undefined {
  const existing = getCookie("_fbp");
  if (existing) return existing;
  if (typeof document === "undefined") return undefined;
  const fbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 1e10)}`;
  setCookie("_fbp", fbp, 90);
  return fbp;
}

// _fbc — the ad click id. Meta only writes it when the URL carries ?fbclid=…,
// and only after the pixel runs. We reconstruct it immediately on landing so an
// ad click never loses it to the race. Format: fb.1.<created_ms>.<fbclid>.
function ensureFbc(): string | undefined {
  const existing = getCookie("_fbc");
  if (existing) return existing;
  if (typeof window === "undefined") return undefined;
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (!fbclid) return undefined; // not an ad click — nothing to reconstruct
  const fbc = `fb.1.${Date.now()}.${fbclid}`;
  setCookie("_fbc", fbc, 90);
  return fbc;
}

// A stable, non-PII first-party id for Meta's external_id match key — its
// diagnostics rank this the highest-impact "other parameter". Persisted in a
// first-party cookie so it's identical across visits and on both the pixel and
// the server twin (both send it raw, so Meta's normalisation matches them up).
export function getExternalId(): string | undefined {
  if (typeof document === "undefined") return undefined;
  let id = getCookie("_eid");
  if (!id) {
    id = newEventId();
    setCookie("_eid", id, 365);
  }
  return id;
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
      // Resolve the match ids client-side (see helpers above) so the server
      // twin isn't at the mercy of whether the pixel has written its cookies
      // yet — this is what lifts fbp/fbc coverage from ~30% toward ~100%.
      fetch("/api/meta/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          eventName: event,
          eventId,
          eventSourceUrl: window.location.href,
          customData: params,
          fbp: ensureFbp(),
          fbc: ensureFbc(),
          externalId: getExternalId(),
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
export function fbSetAdvancedMatching(data: { em?: string; ph?: string; fn?: string; ln?: string; external_id?: string }): void {
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
