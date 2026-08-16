// Tiny client-side wrapper around the Meta Pixel (window.fbq).
// No-ops safely if the pixel isn't loaded (env not set / blocked).
import { phCapture } from "@/lib/posthog";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
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

// Storefront events that also get a server-side twin via the Meta Conversions
// API (see lib/meta-capi.ts + /api/meta/capi). Pixel + CAPI share one event_id
// so Meta deduplicates them — this is what lifts "event coverage" in Events
// Manager. PageView is included: it's the highest-volume event, and a
// pixel-only PageView keeps the dataset-level coverage diagnostic flagged.
// Purchase is intentionally absent (Shopify sends it).
const CAPI_EVENTS = new Set(["PageView", "ViewContent", "AddToCart", "InitiateCheckout"]);

// Same funnel events, forwarded to GA4/Google Ads (gtag) using its standard
// ecommerce event names. Purchase is intentionally absent here too — same
// reason as the CAPI set above: it fires from Shopify's offsite checkout,
// which nothing on this domain can observe. Real Purchase conversions for
// Google Ads should come from Shopify's native Google & YouTube channel.
const GA_FORWARD: Record<string, string> = {
  ViewContent: "view_item",
  AddToCart: "add_to_cart",
  InitiateCheckout: "begin_checkout",
};

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

// Cookies are the primary store (the Meta pixel reads them), but Safari's ITP
// caps JavaScript-written cookies at 7 days — most Instagram/Facebook ad
// traffic is iOS, so _fbp/_fbc/_eid were evaporating weekly and returning
// visitors got fresh ids that matched nothing. localStorage isn't capped, so
// every id is mirrored there and the cookie is re-minted from it on each read.
// In-memory last resort: some in-app browsers / private modes block BOTH
// cookies and localStorage. Without this, each helper would mint a fresh id on
// every event — and sending Meta a DIFFERENT external_id/fbp per event is
// worse for matching than sending none. The module cache keeps the ids stable
// for at least the page lifetime.
const memStore: Record<string, string> = {};

function readId(name: string): string | undefined {
  const fromCookie = getCookie(name);
  if (fromCookie) return fromCookie;
  try {
    const fromStorage = window.localStorage.getItem(name);
    if (fromStorage) return fromStorage;
  } catch {
    /* storage blocked */
  }
  return memStore[name];
}

function persistId(name: string, value: string, days: number): void {
  memStore[name] = value;
  setCookie(name, value, days);
  try {
    window.localStorage.setItem(name, value);
  } catch {
    /* storage blocked — cookie + in-memory cache still work */
  }
}

// _fbp — Meta's browser id. Format: fb.1.<created_ms>.<random>. If the pixel
// hasn't set it yet we create a spec-compliant value; the pixel then reuses it,
// so pixel and CAPI stay in sync. 90-day lifetime matches Meta's own cookie.
function ensureFbp(): string | undefined {
  if (typeof document === "undefined") return undefined;
  let fbp = readId("_fbp");
  if (!fbp) fbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 1e10)}`;
  persistId("_fbp", fbp, 90);
  return fbp;
}

// _fbc — the ad click id. Meta only writes it when the URL carries ?fbclid=…,
// and only after the pixel runs. We reconstruct it immediately on landing so an
// ad click never loses it to the race, and a NEW fbclid always replaces a
// stored one (a fresh ad click must win over last week's — Meta's own pixel
// behaves the same way). Format: fb.1.<created_ms>.<fbclid>.
function ensureFbc(): string | undefined {
  if (typeof window === "undefined") return undefined;
  let fbc = readId("_fbc");
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  // fbclid is the 4th dot-segment onward (it may itself contain dots).
  if (fbclid && (!fbc || fbc.split(".").slice(3).join(".") !== fbclid)) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
  }
  if (!fbc) return undefined; // never landed via an ad click — nothing to send
  persistId("_fbc", fbc, 90);
  return fbc;
}

// A stable, non-PII first-party id for Meta's external_id match key — its
// diagnostics rank this the highest-impact "other parameter". Persisted in a
// first-party cookie so it's identical across visits and on both the pixel and
// the server twin (both send it raw, so Meta's normalisation matches them up).
export function getExternalId(): string | undefined {
  if (typeof document === "undefined") return undefined;
  let id = readId("_eid");
  if (!id) id = newEventId();
  persistId("_eid", id, 365);
  return id;
}

// Resolve + persist all three match ids. Called on boot BEFORE fbq('init') so
// the fbclid is captured on the landing page itself (previously it was only
// read when a funnel event fired — by then a client-side navigation had often
// dropped it from the URL, which is why Events Manager saw the pixel carrying
// fbc while the server twin didn't).
export function bootstrapMatchIds(): void {
  ensureFbp();
  ensureFbc();
  getExternalId();
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

  const gaEvent = GA_FORWARD[event];
  if (gaEvent && typeof window !== "undefined" && typeof window.gtag === "function") {
    // Reshape the Meta-style content_ids/content_name into GA4's expected
    // `items` array when present, so the same call site works for both pixels
    // without every caller needing to know two different param shapes.
    const { content_ids, content_name, ...rest } = (params ?? {}) as Record<string, unknown>;
    const items =
      Array.isArray(content_ids) && content_ids.length
        ? [{ item_id: content_ids[0], item_name: content_name }]
        : undefined;
    window.gtag("event", gaEvent, items ? { ...rest, items } : rest);
  }

  // Fire the server twin. This often runs right before a navigation to Shopify
  // checkout (InitiateCheckout / Buy Now). sendBeacon is the browser API built
  // for exactly that — the browser owns the request and delivers it even after
  // the page unloads, far more reliably than keepalive fetch (which Safari in
  // particular drops during navigations; that gap is why Events Manager showed
  // the server sending ~13% fewer AddToCart events than the pixel). keepalive
  // fetch remains the fallback when sendBeacon is unavailable or its quota is
  // full. Never awaited, never throws to the caller.
  if (capi && eventId && typeof window !== "undefined") {
    try {
      // Resolve the match ids client-side (see helpers above) so the server
      // twin isn't at the mercy of whether the pixel has written its cookies
      // yet — this is what lifts fbp/fbc coverage from ~30% toward ~100%.
      const body = JSON.stringify({
        eventName: event,
        eventId,
        eventSourceUrl: window.location.href,
        customData: params,
        fbp: ensureFbp(),
        fbc: ensureFbc(),
        externalId: getExternalId(),
      });

      let sent = false;
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        try {
          sent = navigator.sendBeacon("/api/meta/capi", new Blob([body], { type: "application/json" }));
        } catch {
          sent = false;
        }
      }
      if (!sent) {
        fetch("/api/meta/capi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body,
        }).catch(() => {});
      }
    } catch {
      /* never let telemetry break the funnel */
    }
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Boot the Meta Pixel. Replaces the old inline <Script> snippet so ordering is
// guaranteed: match ids are resolved/persisted FIRST, then fbq('init') runs
// with external_id as advanced matching — so even the very first PageView
// carries it. (With the old inline snippet, external_id was seeded in a React
// effect AFTER the first PageView had already fired without it — that's the
// 31% external_id coverage Events Manager was flagging.)
// The stub queues all fbq() calls until fbevents.js finishes loading, exactly
// like Meta's own snippet, so nothing fired in the meantime is lost.
export function loadMetaPixel(): void {
  if (!PIXEL_ID || typeof window === "undefined" || typeof document === "undefined") return;

  bootstrapMatchIds();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (!w.fbq) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n: any = (w.fbq = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod.apply(n, args);
      else n.queue.push(args);
    });
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }

  const externalId = getExternalId();
  if (externalId) {
    w.fbq("init", PIXEL_ID, { external_id: externalId });
  } else {
    w.fbq("init", PIXEL_ID);
  }
}

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
  // Always carry external_id into the re-init: fbevents treats each init's
  // userData as THE advanced-matching data, so an {em,fn,ln}-only re-init at
  // login/signup would silently drop the external_id seeded at boot — losing
  // the match key on exactly the best-identified visitors.
  const clean = Object.fromEntries(
    Object.entries({ external_id: getExternalId(), ...data }).filter(([, v]) => !!v),
  );
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
