// Tiny client-side wrapper around the Meta Pixel (window.fbq).
// No-ops safely if the pixel isn't loaded (env not set / blocked).
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function fbTrack(event: string, params?: Record<string, unknown>): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Manual Advanced Matching — lets Meta connect a pixel event to a real
// person via email/phone/name instead of relying purely on cookies (which
// Safari/iOS/ad blockers often block). Meta's pixel script hashes these
// values (SHA-256) client-side before sending anything over the network —
// we never hash or send raw PII ourselves.
//
// Call this the moment a visitor tells us who they are (typing an email into
// a login/signup form, being identified as a logged-in user) — never
// hardcode a fixed value; only ever pass what that visitor just provided.
export function fbSetAdvancedMatching(data: { em?: string; ph?: string; fn?: string; ln?: string }): void {
  if (!PIXEL_ID || typeof window === "undefined") return;
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => !!v));
  if (Object.keys(clean).length === 0) return;

  // window.fbq is defined synchronously by the base pixel <Script> in
  // MetaPixel.tsx, but that script's execution order relative to callers
  // isn't guaranteed — poll briefly instead of assuming it's ready.
  let attempts = 0;
  const tryInit = () => {
    if (typeof window.fbq === "function") {
      window.fbq("init", PIXEL_ID, clean);
    } else if (attempts++ < 40) {
      setTimeout(tryInit, 75);
    }
  };
  tryInit();
}
