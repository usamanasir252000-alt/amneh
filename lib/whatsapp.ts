const ACCOUNT_SID  = process.env.TWILIO_ACCOUNT_SID!;
const AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN!;
const FROM         = process.env.TWILIO_WHATSAPP_FROM!; // e.g. "whatsapp:+14155238886"
const CONTENT_SID  = process.env.TWILIO_CONTENT_SID;   // set after running create-whatsapp-template.mjs

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

// Sends interactive quick-reply buttons if TWILIO_CONTENT_SID is configured,
// otherwise falls back to plain text.
export async function sendOrderConfirmation(
  to: string,
  params: { name: string; orderNumber: string; amount: string }
) {
  if (CONTENT_SID) {
    return twilioPost({
      From: FROM,
      To: `whatsapp:${to}`,
      ContentSid: CONTENT_SID,
      ContentVariables: JSON.stringify({
        '1': params.name,
        '2': params.orderNumber,
        '3': params.amount,
      }),
    });
  }
  return sendWhatsApp(to, buildOrderMessage(params));
}

export function buildOrderMessage(params: {
  name: string;
  orderNumber: string;
  amount: string;
}): string {
  return (
    `Hi ${params.name}! 👋\n\n` +
    `Your *amneh.* order *#${params.orderNumber}* has been placed.\n\n` +
    `🛍️ *Total:* PKR ${params.amount}\n\n` +
    `Please confirm your order:\n` +
    `✅ Reply *CONFIRM* to confirm\n` +
    `❌ Reply *CANCEL* to cancel\n\n` +
    `Thank you for shopping with amneh. ✨`
  );
}
