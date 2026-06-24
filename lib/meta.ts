// Meta Conversions API (CAPI) — server-side event sending.
//
// Stays DORMANT until META env vars are set, so it's safe to deploy before the
// Meta side is finished. We send the Purchase event server-side ONLY when an
// order is confirmed on WhatsApp (COD-quality optimization), never on plain
// order placement.
import crypto from "crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE; // optional, Test Events tab
const API_VERSION = "v21.0";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// Meta requires user identifiers to be normalized then SHA-256 hashed.
function hashEmail(email?: string | null): string | undefined {
  const normalized = email?.trim().toLowerCase();
  return normalized ? sha256(normalized) : undefined;
}

// Phone must be digits-only WITH country code (no +, no leading 0). PK → 92XXXXXXXXXX
function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "92" + digits.slice(1);
  else if (digits.length === 10) digits = "92" + digits;
  return digits ? sha256(digits) : undefined;
}

export interface MetaPurchaseInput {
  eventId: string; // idempotency/dedupe key, e.g. `purchase_${orderId}`
  value: number;
  currency: string; // "PKR"
  email?: string | null;
  phone?: string | null;
  fbp?: string | null; // _fbp cookie captured at checkout
  fbc?: string | null; // _fbc cookie captured at checkout
  clientIp?: string | null;
  clientUserAgent?: string | null;
  eventSourceUrl?: string | null;
  eventTime?: number; // unix seconds; defaults to now
}

// Fires a server-side Purchase to Meta. Best-effort: never throws to the caller.
export async function sendMetaPurchase(input: MetaPurchaseInput): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.log("[Meta CAPI] skipped — META_* env not configured");
    return;
  }

  const user_data: Record<string, unknown> = {};
  const em = hashEmail(input.email);
  const ph = hashPhone(input.phone);
  if (em) user_data.em = [em];
  if (ph) user_data.ph = [ph];
  if (input.fbp) user_data.fbp = input.fbp;
  if (input.fbc) user_data.fbc = input.fbc;
  if (input.clientIp) user_data.client_ip_address = input.clientIp;
  if (input.clientUserAgent) user_data.client_user_agent = input.clientUserAgent;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: input.eventId,
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data,
        custom_data: { currency: input.currency, value: input.value },
      },
    ],
  };
  if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      console.error("[Meta CAPI] Purchase failed:", res.status, JSON.stringify(json));
    } else {
      console.log(
        "[Meta CAPI] Purchase sent:", input.eventId,
        "| events_received:", json.events_received,
        "| matched keys:", Object.keys(user_data).join(",")
      );
    }
  } catch (err) {
    console.error("[Meta CAPI] Purchase error:", err);
  }
}
