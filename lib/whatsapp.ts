const ACCOUNT_SID          = process.env.TWILIO_ACCOUNT_SID!;
const AUTH_TOKEN           = process.env.TWILIO_AUTH_TOKEN!;
const FROM                 = process.env.TWILIO_WHATSAPP_FROM!; // e.g. "whatsapp:+923334274492"
const CONTENT_SID          = process.env.TWILIO_CONTENT_SID;          // amneh_order_confirmation (3 vars)
const CONTENT_SID_DETAILED = process.env.TWILIO_CONTENT_SID_DETAILED; // amneh_order_details (4 vars, with items)

// Normalize Pakistani (and general) phone numbers to E.164 format
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('92')) return `+${digits}`;
  if (digits.startsWith('0')) return `+92${digits.slice(1)}`;
  if (digits.length === 10) return `+92${digits}`;
  return `+${digits}`;
}

async function twilioPost(params: Record<string, string>) {
  const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
    }
  );
  if (!res.ok) throw new Error(`Twilio error ${res.status}: ${await res.text()}`);
  return res.json();
}

// Plain-text fallback (used when TWILIO_CONTENT_SID is not set)
export async function sendWhatsApp(to: string, body: string) {
  return twilioPost({ From: FROM, To: `whatsapp:${to}`, Body: body });
}

// Twilio Content-template variables CANNOT contain newlines, tabs, or 4+
// consecutive spaces — doing so returns error 21656 ("Content Variables
// parameter is invalid") and the message silently fails to send. Sanitize
// every value we put into ContentVariables.
function sanitizeVar(v: string): string {
  return String(v ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{4,}/g, "   ")
    .trim();
}

// Sends interactive quick-reply buttons if a Content SID is configured,
// otherwise falls back to plain text.
// Prefers CONTENT_SID_DETAILED (includes line items) over CONTENT_SID.
export async function sendOrderConfirmation(
  to: string,
  params: { name: string; orderNumber: string; amount: string; items?: string[] }
) {
  // Single-line, newline-free items string for the Content template variable.
  // (The previous '\n'-joined list broke multi-item orders with error 21656.)
  const itemsInline = params.items?.length ? params.items.join(", ") : "";

  if (CONTENT_SID_DETAILED && itemsInline) {
    return twilioPost({
      From: FROM,
      To: `whatsapp:${to}`,
      ContentSid: CONTENT_SID_DETAILED,
      ContentVariables: JSON.stringify({
        '1': sanitizeVar(params.name),
        '2': sanitizeVar(params.orderNumber),
        '3': sanitizeVar(itemsInline),
        '4': sanitizeVar(params.amount),
      }),
    });
  }

  if (CONTENT_SID) {
    return twilioPost({
      From: FROM,
      To: `whatsapp:${to}`,
      ContentSid: CONTENT_SID,
      ContentVariables: JSON.stringify({
        '1': sanitizeVar(params.name),
        '2': sanitizeVar(params.orderNumber),
        '3': sanitizeVar(params.amount),
      }),
    });
  }

  // Plain-text fallback (no Content template) — newlines are fine here.
  const itemsList = params.items?.length
    ? params.items.map((i) => `• ${i}`).join("\n")
    : "";
  return sendWhatsApp(to, buildOrderMessage({ ...params, itemsList }));
}

export function buildOrderMessage(params: {
  name: string;
  orderNumber: string;
  amount: string;
  itemsList?: string;
}): string {
  const itemsSection = params.itemsList
    ? `🛍️ *Items ordered:*\n${params.itemsList}\n\n`
    : '';
  return (
    `Hi ${params.name}! 👋\n\n` +
    `Your *amneh.* order *#${params.orderNumber}* has been placed.\n\n` +
    itemsSection +
    `💰 *Total:* PKR ${params.amount}\n\n` +
    `Please confirm your order:\n` +
    `✅ Reply *CONFIRM* to confirm\n` +
    `❌ Reply *CANCEL* to cancel\n\n` +
    `Thank you for shopping with amneh. ✨`
  );
}
