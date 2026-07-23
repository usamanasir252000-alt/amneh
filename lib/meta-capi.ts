// ── Server-side Meta Conversions API (CAPI) ─────────────────────────────────
// The storefront is this Next.js app, NOT Shopify — so Shopify's native Meta
// integration can't see on-site funnel events (ViewContent / AddToCart /
// InitiateCheckout). Those fire as browser pixel events, which iOS/Safari/ad
// blockers drop heavily, and which land in Events Manager with no server twin —
// that's why "event coverage" sat at ~34%.
//
// This module sends the SERVER twin of each storefront pixel event. The pixel
// and the CAPI event share the same `event_id`, so Meta deduplicates them into
// one (instead of double-counting) while still recovering the ones the browser
// never delivered. Purchase is deliberately NOT here — it fires from Shopify's
// checkout, and Shopify's own integration covers it.
import crypto from "crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
// Bump when Meta deprecates a Graph API version (Events Manager will warn).
const API_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
// Optional: set to the code from Events Manager → Test Events to see events
// arrive live there instead of counting toward production.
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE;

// True only when both credentials are present in the RUNNING environment.
// Used by the /api/meta/capi health check to confirm prod actually has the
// vars set (the .env file is local-only; the host needs them separately).
export function isCapiConfigured(): boolean {
  return Boolean(PIXEL_ID && ACCESS_TOKEN);
}

// SHA-256 lowercase-trimmed, per Meta's hashing spec for PII (em/ph/fn/ln).
function hash(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

// Only forward the standard custom_data fields Meta understands for these
// funnel events — drop anything else so we never leak unexpected props.
const CUSTOM_DATA_KEYS = ["value", "currency", "content_ids", "content_type", "content_name", "num_items", "contents"] as const;

function pickCustomData(params?: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!params) return out;
  for (const k of CUSTOM_DATA_KEYS) {
    if (params[k] !== undefined) out[k] = params[k];
  }
  return out;
}

export interface CapiUserData {
  ip?: string;
  userAgent?: string;
  fbp?: string; // _fbp cookie (Meta browser id)
  fbc?: string; // _fbc cookie (click id, from fbclid)
  email?: string; // raw — hashed here, never sent in the clear
  firstName?: string; // raw — hashed here, never sent in the clear
  lastName?: string; // raw — hashed here, never sent in the clear
}

export interface CapiEventInput {
  eventName: string;
  eventId: string; // MUST equal the pixel's eventID for dedup
  eventSourceUrl?: string;
  eventTime?: number; // unix seconds; defaults to now
  userData: CapiUserData;
  customData?: Record<string, unknown>;
}

/**
 * Send one server-side event to the Meta Conversions API. Never throws —
 * tracking must not break a checkout. Returns true on a 2xx from Meta.
 */
export async function sendCapiEvent(input: CapiEventInput): Promise<boolean> {
  if (!PIXEL_ID || !ACCESS_TOKEN) return false; // no-op until both are configured

  const user_data: Record<string, unknown> = {};
  if (input.userData.ip) user_data.client_ip_address = input.userData.ip;
  if (input.userData.userAgent) user_data.client_user_agent = input.userData.userAgent;
  if (input.userData.fbp) user_data.fbp = input.userData.fbp;
  if (input.userData.fbc) user_data.fbc = input.userData.fbc;
  if (input.userData.email) user_data.em = [hash(input.userData.email)];
  // fn/ln mirror the browser's advanced matching so the server twin matches as
  // strongly as the pixel event — lifts Meta's Event Match Quality score.
  if (input.userData.firstName) user_data.fn = [hash(input.userData.firstName)];
  if (input.userData.lastName) user_data.ln = [hash(input.userData.lastName)];

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl,
        action_source: "website",
        user_data,
        custom_data: pickCustomData(input.customData),
      },
    ],
  };
  if (TEST_EVENT_CODE) body.test_event_code = TEST_EVENT_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[meta-capi] non-2xx:", res.status, text.slice(0, 500));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[meta-capi] send failed:", (err as Error)?.message);
    return false;
  }
}
