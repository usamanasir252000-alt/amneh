// Run once: node --env-file=.env scripts/create-whatsapp-template.mjs
// Prints TWILIO_CONTENT_SID — add it to your .env

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

const res = await fetch('https://content.twilio.com/v1/Content', {
  method: 'POST',
  headers: {
    Authorization:  `Basic ${credentials}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    friendly_name: 'amneh_order_confirmation',
    language: 'en',
    variables: { '1': 'Hassan', '2': '1001', '3': '2500' },
    types: {
      'twilio/quick-reply': {
        body: 'Hi {{1}}! 👋\n\nYour *amneh.* order *#{{2}}* has been placed.\n\n🛍️ *Total:* PKR {{3}}\n\nPlease confirm your order:',
        actions: [
          { title: 'Confirm ✅', id: 'CONFIRM' },
          { title: 'Cancel ❌',  id: 'CANCEL'  },
        ],
      },
    },
  }),
});

const data = await res.json();
if (!res.ok) {
  console.error('Failed:', res.status, JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log('✅ Template created!');
console.log('Content SID:', data.sid);
console.log('\nAdd this to your .env:');
console.log(`TWILIO_CONTENT_SID=${data.sid}`);
