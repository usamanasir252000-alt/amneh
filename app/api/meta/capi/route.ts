import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { sendCapiEvent } from "@/lib/meta-capi";

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
export async function POST(req: Request) {
  let payload: { eventName?: string; eventId?: string; eventSourceUrl?: string; customData?: Record<string, unknown> };
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
  const fbp = cookieStore.get("_fbp")?.value;
  const fbc = cookieStore.get("_fbc")?.value;

  // Advanced matching: attach the logged-in shopper's email (hashed in the
  // helper) when we have a valid session — improves Meta's match quality.
  let email: string | undefined;
  const sessionToken = cookieStore.get("session")?.value;
  if (sessionToken) {
    try {
      const claims = await verifyToken(sessionToken);
      if (typeof claims.email === "string") email = claims.email;
    } catch {
      /* invalid/expired session — send without email */
    }
  }

  await sendCapiEvent({
    eventName,
    eventId,
    eventSourceUrl,
    userData: { ip, userAgent, fbp, fbc, email },
    customData,
  });

  // Always 200 — this is fire-and-forget telemetry; a CAPI hiccup must never
  // surface to the shopper or block the Buy Now redirect that follows.
  return NextResponse.json({ ok: true });
}
