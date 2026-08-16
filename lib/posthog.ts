// Tiny client-side wrapper around PostHog (session replay, heatmaps, funnels).
// Mirrors lib/fbpixel.ts: safe no-ops if PostHog isn't loaded (env not set,
// blocked, or running server-side). The actual init happens once in
// components/PostHog.tsx; everything else just calls phCapture().
//
// posthog-js is loaded via dynamic import() instead of a static import.
// Statically importing it pulled the whole library (~75KB gzipped) into the
// shared bundle every page pays for on first load — including pages with
// nothing to do with analytics (/contact, /terms). A dynamic import only
// fetches it once components/PostHog.tsx actually calls loadPostHog(), which
// it now defers to browser idle time, same as the Meta Pixel/gtag deferrals.
type PostHogModule = typeof import("posthog-js")["default"];

let instance: PostHogModule | null = null;
let loadPromise: Promise<PostHogModule> | null = null;

// Called once from components/PostHog.tsx. Resolves with the same instance on
// every call (module-level cache), so re-renders/re-mounts don't refetch.
export function loadPostHog(): Promise<PostHogModule> {
  if (!loadPromise) {
    loadPromise = import("posthog-js").then((mod) => {
      instance = mod.default;
      return instance;
    });
  }
  return loadPromise;
}

// `__loaded` flips true after init() runs in the PostHog component — until
// then (SSR, not yet dynamically imported, blocked, or no key) every call
// below no-ops rather than throwing.
function ready(): boolean {
  return !!instance && !!(instance as unknown as { __loaded?: boolean }).__loaded;
}

export function phCapture(event: string, props?: Record<string, unknown>): void {
  if (ready()) instance!.capture(event, props);
}

// Register super-properties: attached to every SUBSEQUENT event in this
// session, so you can filter/segment sessions and replays by them — the direct
// analog of Microsoft Clarity's session custom tags (used by lib/diag.ts).
export function phRegister(props: Record<string, unknown>): void {
  if (ready()) instance!.register(props);
}

// Report a caught exception to PostHog Error Tracking. Used by the React error
// boundaries (app/error.tsx, app/global-error.tsx) so a render crash — which a
// shopper experiences as a blank/stuck page and a lost sale — is recorded with
// its page context instead of vanishing into the browser console.
export function phCaptureException(error: unknown, props?: Record<string, unknown>): void {
  if (ready()) instance!.captureException(error, props);
}

// Tie the current session to a known person once they identify themselves
// (login/signup) — so their replays and funnel steps stitch into one profile
// instead of a string of anonymous sessions.
export function phIdentify(distinctId: string, props?: Record<string, unknown>): void {
  if (ready()) instance!.identify(distinctId, props);
}
