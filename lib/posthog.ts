// Tiny client-side wrapper around PostHog (session replay, heatmaps, funnels).
// Mirrors lib/fbpixel.ts: safe no-ops if PostHog isn't loaded (env not set,
// blocked, or running server-side). The actual init happens once in
// components/PostHog.tsx; everything else just calls phCapture().
import posthog from "posthog-js";

// posthog-js is browser-only. `__loaded` flips true after init() runs in the
// PostHog component — until then (SSR, blocked, or no key) every call no-ops.
function ready(): boolean {
  return typeof window !== "undefined" && !!(posthog as unknown as { __loaded?: boolean }).__loaded;
}

export function phCapture(event: string, props?: Record<string, unknown>): void {
  if (ready()) posthog.capture(event, props);
}

// Register super-properties: attached to every SUBSEQUENT event in this
// session, so you can filter/segment sessions and replays by them — the direct
// analog of Microsoft Clarity's session custom tags (used by lib/diag.ts).
export function phRegister(props: Record<string, unknown>): void {
  if (ready()) posthog.register(props);
}

// Tie the current session to a known person once they identify themselves
// (login/signup) — so their replays and funnel steps stitch into one profile
// instead of a string of anonymous sessions.
export function phIdentify(distinctId: string, props?: Record<string, unknown>): void {
  if (ready()) posthog.identify(distinctId, props);
}

export { posthog };
