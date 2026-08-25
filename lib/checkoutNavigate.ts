import { logEvent } from "@/lib/clientLog";

// Navigating to Shopify checkout, with an automatic re-roll when the
// navigation stalls before it commits.
//
// Why: Chrome races HTTP/3 to shop.amnehofficial.com (Cloudflare advertises
// `alt-svc: h3=":443"` there; our own Vercel origin sends no alt-svc, which is
// why only checkout is affected). Where UDP/443 is degraded — Pakistani
// networks, i.e. most of this store's traffic — that race stalls in the
// browser's connection-blocked state before a single byte is sent, then either
// falls back to HTTP/2 or dies with net::ERR_CONNECTION_CLOSED and drops the
// shopper on a browser error page. Measured on the live store, time from
// navigation to the checkout document committing is sharply bimodal:
//
//   healthy   ~0.7-1.3s
//   stalled   ~9-30s, or an outright connection failure
//
// There is nothing in between, and each navigation re-rolls independently —
// roughly 60% land healthy. So abandoning a stalled attempt and re-firing beats
// waiting one out: three rolls make a fast one very likely, and the worst case
// becomes ~6s of re-rolling instead of a 30s freeze ending in an error page.
//
// RETRY_AFTER_MS is set against the healthy commit time, not the stall: 3s is
// well past any healthy navigation while still far short of the stall.
//
// This is a mitigation, not a fix. The fix is Shopify not advertising HTTP/3 on
// that domain, or the network path being repaired — neither is ours to make.
const RETRY_AFTER_MS = 3000;
const MAX_ATTEMPTS = 3;

/**
 * Send the shopper to `url`, re-firing the navigation if it hasn't committed
 * within RETRY_AFTER_MS. Returns immediately; the page is being torn down.
 *
 * Safe to retry: the checkout URL is a GET that resolves an existing cart to a
 * checkout session. Re-requesting it creates no order and no second cart.
 *
 * Self-limiting by construction — the moment the checkout document commits,
 * this page unloads and every pending timer dies with it. A navigation that has
 * already succeeded can never be interrupted.
 */
export function navigateToCheckout(url: string, context: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || !url) return;

  let attempt = 0;
  let timer: number | undefined;

  const cancel = () => {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
  };
  // Fires as the new document takes over — the success path.
  window.addEventListener("pagehide", cancel, { once: true });

  const go = () => {
    attempt += 1;
    if (attempt < MAX_ATTEMPTS) {
      timer = window.setTimeout(() => {
        // Still running means the navigation never committed. Abort the stalled
        // attempt explicitly — assigning location.href alone is not reliably
        // honoured while a navigation is already pending — and re-roll.
        logEvent("checkout_nav_retry", { ...context, attempt, afterMs: RETRY_AFTER_MS });
        window.stop();
        go();
      }, RETRY_AFTER_MS);
    }
    window.location.href = url;
  };

  go();
}
