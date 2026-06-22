import { NextRequest } from 'next/server';
import {
  findOrderByPhone,
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

function emptyTwiml() {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  );
}

export async function POST(req: NextRequest) {
  const form = await req.formData();

  const from = String(form.get('From') ?? '');
  const body = String(form.get('Body') ?? '').trim().toUpperCase();
  const phone = from.replace('whatsapp:', '').trim();

  if (!phone) return emptyTwiml();

  console.log('[WhatsApp Reply] from:', from, '→ phone:', phone, '→ body:', body);

  const order = await findOrderByPhone(phone).catch((err) => {
    console.error('[WhatsApp Reply] Shopify lookup failed:', err);
    return null;
  });

  console.log('[WhatsApp Reply] order found:', order ? order.name : 'NONE');

  if (!order) {
    return twiml(
      "We couldn't find any recent order linked to your number. " +
      'Contact us at amnehofficial.com if you need help.'
    );
  }

  const orderName = order.name;
  const tags = order.tags;
  const isPending   = tags.includes('wa-pending');
  const isConfirmed = tags.includes('wa-confirmed');
  const isCancelled = tags.includes('wa-cancelled');

  // ── CONFIRM ────────────────────────────────────────────────────────────────
  if (body.includes('CONFIRM')) {
    if (isConfirmed) {
      return twiml(
        `✅ Your amneh. order ${orderName} is already confirmed!\n\n` +
        `We are already processing it and will notify you once it is on its way.`
      );
    }
    if (isCancelled) {
      // Case 4 — cannot confirm a cancelled order
      return twiml(
        `❌ Your amneh. order ${orderName} was already cancelled and cannot be confirmed.\n\n` +
        `Visit amnehofficial.com to place a new order.`
      );
    }
    if (isPending) {
      try {
        await removeOrderTag(order.id, 'wa-pending');
        await addOrderTag(order.id, 'wa-confirmed');
      } catch (err) {
        console.error('[Shopify] Tag update failed on confirm:', err);
        // Don't claim success when the tag update actually failed.
        return twiml(
          `⚠️ We couldn't confirm your amneh. order ${orderName} just now. ` +
          `Please try again shortly or contact us at amnehofficial.com.`
        );
      }
      return twiml(
        `✅ Your amneh. order ${orderName} is confirmed!\n\n` +
        `We'll start processing it right away and notify you once it's on its way. ` +
        `Thank you for choosing amneh. 🌿`
      );
    }
  }

  // ── CANCEL ─────────────────────────────────────────────────────────────────
  if (body.includes('CANCEL')) {
    if (isCancelled) {
      return twiml(
        `❌ Your amneh. order ${orderName} is already cancelled.\n\n` +
        `Visit amnehofficial.com to place a new order.`
      );
    }
    if (isConfirmed) {
      // Case 3 — cannot cancel a confirmed order
      return twiml(
        `✅ Your amneh. order ${orderName} has already been confirmed and cannot be cancelled.\n\n` +
        `If you still need to cancel, please contact us directly at amnehofficial.com.`
      );
    }
    if (isPending) {
      try {
        // Cancel FIRST — this is what triggers Shopify's "Order canceled" email
        // (notifyCustomer: true). Only tag + confirm to the customer once it
        // actually succeeds, so we never claim success on a failed cancel.
        await cancelShopifyOrder(order.id);
        await removeOrderTag(order.id, 'wa-pending');
        await addOrderTag(order.id, 'wa-cancelled');
      } catch (err) {
        console.error('[Shopify] Cancel failed:', err);
        return twiml(
          `⚠️ We couldn't cancel your amneh. order ${orderName} just now. ` +
          `Please contact us at amnehofficial.com and we'll sort it out right away.`
        );
      }
      return twiml(
        `❌ Your amneh. order ${orderName} has been cancelled.\n\n` +
        `If this was a mistake, please visit amnehofficial.com to place a new order. ` +
        `We hope to see you again soon! 💙`
      );
    }
  }

  // ── Unrecognised reply — ignore silently ───────────────────────────────────
  return emptyTwiml();
}
