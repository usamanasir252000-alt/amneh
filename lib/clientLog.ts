// Fire-and-forget client-side event reporting, so failures that never reach
// our server (dropped connection, timeout, customer closes the in-app browser
// mid-request) still show up in our logs instead of only in a customer's
// screenshot. Never throws, never blocks the UI — logging must not become
// another way for a flow to fail.
//
// Uses sendBeacon when available: it's designed to survive page navigation/
// unload, which matters here because a successful Buy Now immediately does
// window.location.href = checkoutUrl — a plain fetch can get cancelled by the
// navigation before it's sent.
export function logEvent(event: string, data?: Record<string, unknown>): void {
  try {
    const payload = JSON.stringify({ event, data, ts: Date.now(), path: typeof window !== "undefined" ? window.location.pathname : undefined });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/client-log", blob);
      if (ok) return;
    }

    // Fallback: fetch with keepalive so it can survive a navigation.
    fetch("/api/client-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Logging must never throw into the calling flow.
  }
}
