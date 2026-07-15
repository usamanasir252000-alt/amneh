// Quantity-bundle tiers shown on the product page ("buy more, save more").
//
// The percentages here are DISPLAY, and each discounted tier carries the
// Shopify discount CODE that actually applies the saving at checkout. The
// site attaches the code to the cart automatically based on quantity (Buy Now
// and the cart→checkout flow both do this), so on-site price = checkout price.
//
// Matching Shopify setup (already created):
//   BUNDLE5       — 5% off,  minimum quantity of items = 2
//   BUNDLE10      — 10% off, minimum quantity of items = 3
//   FREEBUNDLE10  — free shipping, minimum quantity of items = 2
// The min-quantity requirement means Shopify rejects a code that doesn't
// qualify, so the codes can't be abused on a smaller order.
//
// ⚠️ For the %-off code AND the free-shipping code to apply TOGETHER, they
// must be set to combine in Shopify:
//   • BUNDLE5 / BUNDLE10 (product discounts) → edit → Combinations →
//     check "Shipping discounts".
//   • FREEBUNDLE10 (shipping discount) → edit → Combinations →
//     check "Product discounts".
// Without this, Shopify applies only one of them.
//
// Keep discountPct + codes here in sync with the Shopify discounts above.

// Free-shipping code + the minimum quantity at which it applies.
const FREE_SHIPPING_CODE = "FREEBUNDLE10";
export const FREE_SHIPPING_MIN_QTY = 2;
// The store already gives automatic free shipping on orders at/above this
// subtotal (PKR). Above it, FREEBUNDLE10 must NOT be sent — the automatic
// rule already covers shipping, and applying a second free-shipping discount
// makes Shopify reject it with "not available for your shipping address".
// So the code is only used to cover the gap: qty 2+ but under the threshold.
export const AUTO_FREE_SHIPPING_THRESHOLD = 2500;

export interface BundleTier {
  qty: number;
  discountPct: number;   // display % — must match the Shopify code's value
  code?: string;         // %-off Shopify code applied at checkout for this qty
  badge?: string;        // small label, e.g. "Most popular" / "Best value"
  freeShipping?: boolean;
}

export const BUNDLE_TIERS: BundleTier[] = [
  { qty: 1, discountPct: 0 },
  { qty: 2, discountPct: 5, code: "BUNDLE5", badge: "Most popular", freeShipping: true },
  { qty: 3, discountPct: 10, code: "BUNDLE10", badge: "Best value", freeShipping: true },
];

// All Shopify discount codes to apply for a given total quantity: the best
// %-off tier code met, PLUS the free-shipping code whenever the order has
// FREE_SHIPPING_MIN_QTY+ items.
//
// Free shipping is QUANTITY-based, NOT subtotal-based, and the code is sent
// unconditionally once qualified. Earlier this was gated on
// `subtotal < AUTO_FREE_SHIPPING_THRESHOLD` (defer to the store's automatic
// "free over PKR X" rule above that). That silently broke 2-item orders: the
// %-off bundle discount drops the total below the threshold — 2×1300 = 2600 →
// 2470 after 5% — so Shopify's subtotal rule (evaluated post-discount) never
// fired, AND we'd suppressed the code (pre-discount 2600 ≥ 2500). Result: no
// free shipping in the gap. Quantity can't drift like a discounted subtotal
// can, so sending FREEBUNDLE10 on 2+ items is reliable. `subtotal` is unused
// now but kept in the signature for call-site compatibility.
export function bundleDiscountCodes(totalQty: number, subtotal: number): string[] {
  void subtotal;
  const codes: string[] = [];
  let pctCode: string | null = null;
  for (const tier of BUNDLE_TIERS) {
    if (tier.code && totalQty >= tier.qty) pctCode = tier.code;
  }
  if (pctCode) codes.push(pctCode);
  if (totalQty >= FREE_SHIPPING_MIN_QTY) codes.push(FREE_SHIPPING_CODE);
  return codes;
}

// Client-side preview of what the bundle codes will apply at checkout, so the
// cart drawer can SHOW the discounted price + free shipping the moment an order
// qualifies — instead of full price with a vague "calculated at checkout" note.
// Derived from the SAME BUNDLE_TIERS + thresholds that pick the actual Shopify
// codes, so the previewed saving matches what checkout applies.
export interface BundleSavings {
  pct: number;               // best %-off tier met (0 / 5 / 10)
  discountAmount: number;    // PKR taken off the subtotal by that %-tier
  discountedSubtotal: number;
  freeShipping: boolean;     // qualifies via quantity OR the auto threshold
  nextPct: number;           // %-off of the next better tier (0 if none)
  qtyToNextPct: number;      // items still needed to reach nextPct (0 if none)
}

export function bundleSavings(totalQty: number, subtotal: number): BundleSavings {
  let pct = 0;
  for (const tier of BUNDLE_TIERS) {
    if (totalQty >= tier.qty) pct = tier.discountPct;
  }
  const next = BUNDLE_TIERS.find((t) => t.qty > totalQty && t.discountPct > pct);
  const discountAmount = Math.round((subtotal * pct) / 100);
  return {
    pct,
    discountAmount,
    discountedSubtotal: subtotal - discountAmount,
    freeShipping:
      totalQty >= FREE_SHIPPING_MIN_QTY || subtotal >= AUTO_FREE_SHIPPING_THRESHOLD,
    nextPct: next?.discountPct ?? 0,
    qtyToNextPct: next ? next.qty - totalQty : 0,
  };
}
