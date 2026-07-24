import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { sendCapiEvent, isCapiConfigured } from "@/lib/meta-capi";

// Node runtime: the CAPI helper hashes PII with node:crypto.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only the storefront funnel events get a server twin. Anything else is
// ignored so a stray/forged client call can't push arbitrary events to Meta.
const ALLOWED = new Set(["ViewContent", "AddToCart", "InitiateCheckout"]);

// Receives the server twin of a storefront pixel event. The browser sends the
// event name, the SAME event_id it gave fbq (for dedup), the page URL, and the
// funnel params. The server adds what only it can see/trust: real IP, user
// agent, the _fbp/_fbc cookies, and the logged-in email — then forwards to
// Meta's Conversions API.
// Health check: curl https://<host>/api/meta/capi → { configured: true }
// confirms the RUNNING environment has both META_CAPI_ACCESS_TOKEN and
// NEXT_PUBLIC_META_PIXEL_ID. Exposes no secret values. If this returns
// { configured: false } in production, that's why event coverage is stuck —
// the server twin is a no-op until the host has both vars set.
export async function GET() {
  return NextResponse.json({ configured: isCapiConfigured() });
}

export async function POST(req: Request) {
  let payload: {
    eventName?: string;
    eventId?: string;
    eventSourceUrl?: string;
    customData?: Record<string, unknown>;
    fbp?: string;
    fbc?: string;
    externalId?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { eventName, eventId, eventSourceUrl, customData } = payload;
  if (!eventName || !eventId || !ALLOWED.has(eventName)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const cookieStore = await cookies();
  const hdrs = await headers();

  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    undefined;
  const userAgent = hdrs.get("user-agent") || undefined;
  // Prefer the values the client resolved (see lib/fbpixel.ts): on a cold ad
  // landing the pixel often hasn't written _fbp/_fbc yet when the event fires,
  // so the request cookies are empty. The client reconstructs them (and _fbc
  // from ?fbclid) and sends them in the body — cookies are only the fallback.
  const fbp = payload.fbp || cookieStore.get("_fbp")?.value;
  const fbc = payload.fbc || cookieStore.get("_fbc")?.value;
  const externalId = payload.externalId || cookieStore.get("_eid")?.value;

  // Advanced matching: attach the logged-in shopper's email/name (hashed in
  // the helper) when we have a valid session. Mirroring the browser pixel's
  // em/fn/ln here lifts Meta's Event Match Quality for the server twin.
  let email: string | undefined;
  let firstName: string | undefined;
  let lastName: string | undefined;
  const sessionToken = cookieStore.get("session")?.value;
  if (sessionToken) {
    try {
      const claims = await verifyToken(sessionToken);
      if (typeof claims.email === "string") email = claims.email;
      if (typeof claims.firstName === "string") firstName = claims.firstName;
      if (typeof claims.lastName === "string") lastName = claims.lastName;
    } catch {
      /* invalid/expired session — send without matching keys */
    }
  }

  await sendCapiEvent({
    eventName,
    eventId,
    eventSourceUrl,
    userData: { ip, userAgent, fbp, fbc, externalId, email, firstName, lastName },
    customData,
  });

  // Always 200 — this is fire-and-forget telemetry; a CAPI hiccup must never
  // surface to the shopper or block the Buy Now redirect that follows.
  return NextResponse.json({ ok: true });
}
