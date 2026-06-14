import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { addOrderTag } from '@/lib/shopify-admin';
import { sendOrderConfirmation, formatPhone } from '@/lib/whatsapp';

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

  // Tag the order in Shopify so we can look it up when the customer replies
  try {
    await addOrderTag(shopifyGid, 'wa-pending');
  } catch (err) {
    console.error('[Shopify] Failed to tag order:', err);
  }

  // Send WhatsApp confirmation request to customer (buttons if template SID is set)
  try {
    await sendOrderConfirmation(phone, { name: customerName, orderNumber, amount, items });
  } catch (err) {
    console.error('[WhatsApp] Failed to send message:', err);
  }

  return NextResponse.json({ ok: true });
}
