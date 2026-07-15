// sessionStorage key set right before we send the shopper OFF the site to the
// Shopify checkout (see handleBuyNow in ProductClient + goToCheckout in
// CartContext). Its presence on the next page-show tells the inline head
// script in app/layout.tsx to force a clean reload, so returning from checkout
// never lands on a stuck/un-hydrated page.
//
// The reload logic itself lives as a raw inline <script> in layout.tsx <head>
// (it must run independent of React — the failure mode is the page never
// hydrating). Keep this key string in sync with the one hardcoded there.
export const LEFT_FOR_CHECKOUT_KEY = "amneh:left-for-checkout";
