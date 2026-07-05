// fetch() wrapper with a hard timeout + automatic retry on transient failures.
//
// Motivation: mobile / in-app-browser connections intermittently drop mid-request
// (e.g. net::ERR_HTTP2_PING_FAILED). These are transient — an immediate retry
// almost always succeeds. This makes that recovery automatic so the user never
// sees the error.
//
// Retries on: network errors (dropped connection) and timeouts. Optionally on
// 5xx server responses. Never retries on 4xx (a 404 means "doesn't exist",
// retrying won't help).

export interface FetchRetryOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  // Retry when the server responds 5xx. Safe for idempotent GETs; turn OFF for
  // non-idempotent POSTs where the server may have already processed the request.
  retryOnServerError?: boolean;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(
  url: string,
  {
    timeoutMs = 10000,
    retries = 2,
    backoffMs = 600,
    retryOnServerError = true,
    ...init
  }: FetchRetryOptions = {}
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      // Transient server-side failure — retry if we have attempts left.
      if (retryOnServerError && res.status >= 500 && attempt < retries) {
        await wait(backoffMs * (attempt + 1));
        continue;
      }
      return res;
    } catch (err) {
      // Network error or aborted-by-timeout. Retry if attempts remain.
      clearTimeout(timer);
      lastError = err;
      if (attempt < retries) {
        await wait(backoffMs * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError ?? new Error("fetchWithRetry: exhausted retries");
}
