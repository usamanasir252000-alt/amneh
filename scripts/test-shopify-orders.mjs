const id = process.env.AUTH_CLIENT_ID;
const secret = process.env.AUTH_CLIENT_SECRET;
const domain = (process.env.SHOPIFY_STORE || process.env.SHOPIFY_STORE_DOMAIN).replace(/^https?:\/\//,'').replace(/\/$/,'');

const r = await fetch('https://' + domain + '/admin/oauth/access_token', {
  method: 'POST',
  headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }).toString()
});
const j = await r.json();
console.log('scopes granted:', j.scope);

const g = await fetch('https://' + domain + '/admin/api/2026-04/graphql.json', {
  method: 'POST',
  headers: {'Content-Type':'application/json','X-Shopify-Access-Token': j.access_token},
  body: JSON.stringify({ query: '{ orders(first: 1, sortKey: CREATED_AT, reverse: true) { edges { node { id name tags } } } }' })
});
console.log(JSON.stringify(await g.json(), null, 2));
