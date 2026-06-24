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
