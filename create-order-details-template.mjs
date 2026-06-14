// Run with: node create-order-details-template.mjs
// Creates the amneh_order_details WhatsApp template (with line items) and submits for Meta approval.
// Prints the Content SID — set it as TWILIO_CONTENT_SID_DETAILED in Vercel.

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually
const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in .env');
  process.exit(1);
}

const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

const templateBody = {
  friendly_name: 'amneh_order_details_v2',
  language: 'en',
  variables: {
    '1': 'Hassan',
    '2': '1001',
    '3': '• Hydrating Serum × 1\n• Glow Cream × 2',
    '4': '2500',
  },
  types: {
    'twilio/quick-reply': {
      body:
        'Hi {{1}}! 👋\n\n' +
        'Your *amneh.* order *#{{2}}* has been placed.\n\n' +
        '🛍️ *Items ordered:*\n{{3}}\n\n' +
        '💰 *Total:* PKR {{4}}\n\n' +
        'Please confirm your order to proceed with delivery.',
      actions: [
        { title: 'Confirm', id: 'confirm' },
        { title: 'Cancel',  id: 'cancel'  },
      ],
    },
  },
};

// Step 1 — Create the content template
console.log('Creating template...');
const createRes = await fetch('https://content.twilio.com/v1/Content', {
  method: 'POST',
  headers: {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(templateBody),
});

if (!createRes.ok) {
  const err = await createRes.text();
  console.error('Failed to create template:', err);
  process.exit(1);
}

const created = await createRes.json();
const sid = created.sid;
console.log(`\n✅ Template created — SID: ${sid}`);

// Step 2 — Submit for WhatsApp / Meta approval
console.log('Submitting for WhatsApp approval...');
const approveRes = await fetch(
  `https://content.twilio.com/v1/Content/${sid}/ApprovalRequests/whatsapp`,
  {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'amneh_order_details_v2', category: 'UTILITY' }),
  }
);

if (!approveRes.ok) {
  const err = await approveRes.text();
  console.error('Approval submission failed:', err);
  console.log('Template SID (save this):', sid);
  process.exit(1);
}

const approval = await approveRes.json();
console.log(`\n✅ Submitted for approval — status: ${approval.whatsapp?.status ?? 'pending'}`);
console.log('\n─────────────────────────────────────────');
console.log('Add this to Vercel + .env:');
console.log(`TWILIO_CONTENT_SID_DETAILED=${sid}`);
console.log('─────────────────────────────────────────\n');
