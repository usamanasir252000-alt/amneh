// Single source of truth for the customer-facing WhatsApp number.
//
// WhatsApp has restricted this business's numbers more than once, forcing
// number swaps. Before this file, the number was hardcoded in five places —
// a hunt-and-edit + redeploy every time, with a dead chat button until done.
// Now: set NEXT_PUBLIC_WHATSAPP_PHONE in Vercel (digits only, with country
// code, no "+", e.g. 923001234567) and redeploy — no code changes.
//
// NOTE: this is the CUSTOMER-CHAT number (inbound wa.me links). The order-
// confirmation sender is separate — TWILIO_WHATSAPP_FROM, the official
// WhatsApp Business API number, configured server-side only.
// Fallback is the owner's personal number (temporary while the business
// number is restriction-prone) so chat buttons still reach a live account
// even if the env var is missing in a deploy.
export const WHATSAPP_PHONE =
  process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "923454214815";

// Human-readable form for policy/contact pages, e.g. "+92 306 8639708".
// Simple fixed split — good enough for PK numbers (92 + 3-digit prefix).
export const WHATSAPP_DISPLAY = `+${WHATSAPP_PHONE.slice(0, 2)} ${WHATSAPP_PHONE.slice(2, 5)} ${WHATSAPP_PHONE.slice(5)}`;

// wa.me chat link, optionally with a prefilled message.
export function waChatLink(text?: string): string {
  return `https://wa.me/${WHATSAPP_PHONE}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
