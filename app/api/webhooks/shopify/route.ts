import { NextRequest, NextResponse, after } from 'next/server';
import crypto from 'crypto';
import { addOrderTag, getOrderTags, waSidTag, awardLoyaltyForOrder } from '@/lib/shopify-admin';
import { sendOrderConfirmation, formatPhone } from '@/lib/whatsapp';

// NOTE: The Meta CAPI Purchase event is NO LONGER fired here. Shopify's native
// "Facebook & Instagram" (Meta) integration now sends Purchase server-side from
// the checkout with proper matching (click IDs / _fbp / email / phone /
// external_id) — our hand-rolled CAPI event matched at ~0% and, once Shopify's
// is live, firing ours too would double-count every sale. See lib/meta.ts
// (removed) history if this ever needs to come back.

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify Shopify HMAC
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (secret) {
    const computed = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64');
    if (computed !== hmacHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let order: any;
  try {
    order = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // For COD (every order here), points are awarded when the customer replies
  // CONFIRM on WhatsApp — see app/api/webhooks/whatsapp/route.ts. We still
  // honour orders/paid for any prepaid order; the processed_orders list makes
  // the two paths idempotent, so an order can never be counted twice.
  // The WhatsApp confirmation prompt is sent on the order-creation topic (below).
  const topic = req.headers.get('x-shopify-topic') || '';
  if (topic === 'orders/paid') {
    try {
      await awardLoyaltyForOrder(String(order.id));
    } catch (err) {
      console.error('[Loyalty] Failed to process paid order:', err);
    }
    return NextResponse.json({ ok: true, loyalty: true });
  }

  // Only orders/create triggers the WhatsApp prompt. Any other topic pointed
  // at this URL (orders/updated, etc.) must not re-send the message.
  if (topic !== 'orders/create') {
    console.log('[Shopify Webhook] Ignoring topic:', topic);
    return NextResponse.json({ ok: true, skipped: topic });
  }

  // (Meta CAPI Purchase used to fire here — removed; Shopify's native Meta
  // integration now owns Purchase reporting. See the note at the top.)

  // Extract phone from wherever Shopify puts it
  const rawPhone =
    order.shipping_address?.phone ||
    order.billing_address?.phone ||
    order.customer?.phone ||
    order.phone ||
    null;

  console.log('[Shopify Webhook] order_number:', order.order_number);
  console.log('[Shopify Webhook] phone sources:', {
    shipping: order.shipping_address?.phone,
    billing: order.billing_address?.phone,
    customer: order.customer?.phone,
    order: order.phone,
  });
  console.log('[Shopify Webhook] Twilio env set:', {
    sid: !!process.env.TWILIO_ACCOUNT_SID,
    token: !!process.env.TWILIO_AUTH_TOKEN,
    from: !!process.env.TWILIO_WHATSAPP_FROM,
  });

  if (!rawPhone) {
    console.log('[Shopify Webhook] Skipping — no phone number on order');
    return NextResponse.json({ ok: true, skipped: 'no_phone' });
  }

  const phone = formatPhone(rawPhone);
  const shopifyGid = `gid://shopify/Order/${order.id}`;
  const orderNumber = String(order.order_number);
  const customerName =
    order.shipping_address?.first_name ||
    order.customer?.first_name ||
    'there';
  const amount = order.total_price;

  // Format line items as "Product Name × qty"
  const items: string[] = (order.line_items ?? []).map(
    (item: any) => `${item.title} × ${item.quantity}`
  );

  // Do the slow work (Shopify tags + Twilio send) AFTER responding. Shopify
  // drops the connection and RETRIES the whole delivery if we don't return a
  // 2xx within ~5s — the old await-everything-then-respond flow is exactly
  // what caused duplicate WhatsApp prompts (order #1112 got two).
  after(async () => {
    // Idempotency: a retried/duplicate delivery carries the ORIGINAL payload,
    // so the wa-pending tag we added won't be in `order.tags` — check live.
    try {
      const tags = await getOrderTags(shopifyGid);
      if (tags.includes('wa-pending')) {
        console.log('[Shopify Webhook] Duplicate delivery for', orderNumber, '— prompt already sent, skipping');
        return;
      }
    } catch (err) {
      // If the tag lookup fails we still send — a missed prompt is worse than
      // a rare duplicate.
      console.error('[Shopify] Failed to read order tags (sending anyway):', err);
    }

    // Tag the order in Shopify so we can look it up when the customer replies
    try {
      await addOrderTag(shopifyGid, 'wa-pending');
    } catch (err) {
      console.error('[Shopify] Failed to tag order:', err);
    }

    // Send WhatsApp confirmation request to customer (buttons if template SID is set)
    try {
      const msg = await sendOrderConfirmation(phone, { name: customerName, orderNumber, amount, items });
      // Stamp this prompt's Twilio SID onto the order so a reply to THIS specific
      // message resolves to THIS order — even if the customer has several open.
      const sid = msg?.sid;
      console.log('[WhatsApp] sent prompt for', orderNumber, '→ sid:', sid ?? 'MISSING',
        '| response keys:', msg ? Object.keys(msg).join(',') : 'no-response');
      if (sid) {
        try {
          await addOrderTag(shopifyGid, waSidTag(sid));
          console.log('[Shopify] tagged', orderNumber, 'with', waSidTag(sid));
        } catch (err) {
          console.error('[Shopify] Failed to tag order with message SID:', err);
        }
      } else {
        console.error('[WhatsApp] No SID on Twilio response — reply matching will fall back to latest order');
      }
    } catch (err) {
      console.error('[WhatsApp] Failed to send message:', err);
    }
  });

  return NextResponse.json({ ok: true });
}
