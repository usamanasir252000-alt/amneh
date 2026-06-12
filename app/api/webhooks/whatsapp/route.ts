import { NextRequest } from 'next/server';
import {
  findPendingOrderByPhone,
  addOrderTag,
  removeOrderTag,
  cancelShopifyOrder,
} from '@/lib/shopify-admin';

function twiml(message: string) {
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  );
}

export async function POST(req: NextRequest) {
  const form = await req.formData();

  // Twilio sends the sender number as "whatsapp:+923XXXXXXXXX"
  const from = String(form.get('From') ?? '');
  const body = String(form.get('Body') ?? '').trim().toUpperCase();
  const phone = from.replace('whatsapp:', '').trim();

  if (!phone) {
    return twiml('Unable to process your request. Please contact amneh. support.');
  }

  console.log('[WhatsApp Reply] from:', from, '→ phone:', phone, '→ body:', body);

  // Find the most recent order tagged wa-pending for this phone number
  const order = await findPendingOrderByPhone(phone).catch((err) => {
    console.error('[WhatsApp Reply] Shopify lookup failed:', err);
    return null;
  });

  console.log('[WhatsApp Reply] order found:', order ? order.name : 'NONE');

  if (!order) {
    return twiml(
      "We couldn't find a pending order linked to your number. " +
      'Please contact amneh. support or visit amneh.com for help.'
    );
  }

  const orderName = order.name; // e.g. "#1001"

  // ── CONFIRM ────────────────────────────────────────────────────────────────
  if (body.includes('CONFIRM')) {
    try {
      await removeOrderTag(order.id, 'wa-pending');
      await addOrderTag(order.id, 'wa-confirmed');
    } catch (err) {
      console.error('[Shopify] Tag update failed on confirm:', err);
    }

    return twiml(
      `✅ Your amneh. order ${orderName} is confirmed!\n\n` +
      `We'll start processing it right away and notify you once it's on its way. ` +
      `Thank you for choosing amneh. 🌿`
    );
  }

  // ── CANCEL ─────────────────────────────────────────────────────────────────
  if (body.includes('CANCEL')) {
    try {
      await removeOrderTag(order.id, 'wa-pending');
      await addOrderTag(order.id, 'wa-cancelled');
      await cancelShopifyOrder(order.id);
    } catch (err) {
      console.error('[Shopify] Cancel failed:', err);
      // Respond to customer anyway — admin can handle manually if needed
    }

    return twiml(
      `❌ Your amneh. order ${orderName} has been cancelled.\n\n` +
      `If this was a mistake, please visit amneh.com to place a new order. ` +
      `We hope to see you again soon! 💙`
    );
  }

  // ── Unrecognised reply ─────────────────────────────────────────────────────
  return twiml(
    `Please reply CONFIRM to confirm or CANCEL to cancel your amneh. order ${orderName}.`
  );
}
