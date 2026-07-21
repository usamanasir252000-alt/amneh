// Next.js loads this at server startup. The onRequestError hook fires for
// UNCAUGHT errors thrown while rendering a route or handling a request on the
// server — we forward them to PostHog Error Tracking, tied to the visitor's
// session via their PostHog cookie when present.
//
// NOTE: errors that a route CATCHES itself (like createCart failing in the
// buy-now route, which returns a 502 instead of throwing) do NOT reach this
// hook — those are captured explicitly at the catch site. This hook is the
// safety net for everything else.
export function register(): void {
  // Nothing to initialize; the posthog-node client is created lazily on first use.
}

export const onRequestError = async (
  err: unknown,
  request: { headers?: Record<string, string | string[] | undefined> },
): Promise<void> => {
  // posthog-node only runs in the Node.js runtime, not the Edge runtime.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { captureServerException, distinctIdFromCookie } = await import("./lib/posthog-server");
  const distinctId = distinctIdFromCookie(request?.headers?.cookie);
  await captureServerException(err, distinctId, { source: "onRequestError" });
};
