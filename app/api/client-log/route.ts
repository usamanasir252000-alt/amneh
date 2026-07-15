import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Whitelisted so this can't be turned into an open logging sink for arbitrary
// text — only events we explicitly instrument are accepted.
const ALLOWED_EVENTS = new Set([
  "product_view",
  "add_to_cart_attempt",
  "add_to_cart_success",
  "add_to_cart_failed",
  "buy_now_click",
  "buy_now_success",
  "buy_now_failed",
  "checkout_click",
  "checkout_link_timeout",
  "checkout_redirect",
  "whatsapp_order_click",
  "bundle_discount_timeout",
]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, data, ts, path } = body as {
      event?: string;
      data?: Record<string, unknown>;
      ts?: number;
      path?: string;
    };

    if (!event || !ALLOWED_EVENTS.has(event)) {
      return new NextResponse(null, { status: 204 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      undefined;

    // Structured single-line log — searchable in Vercel logs by event name,
    // path, or ip to trace a specific customer's funnel.
    console.log(
      "[client-event]",
      JSON.stringify({
        event,
        path,
        ip,
        ua: req.headers.get("user-agent") || undefined,
        clientTs: ts,
        ...data,
      })
    );

    return new NextResponse(null, { status: 204 });
  } catch {
    // Never let a malformed beacon payload surface as an error.
    return new NextResponse(null, { status: 204 });
  }
}
