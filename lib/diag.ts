// ── Client-side page diagnostics ────────────────────────────────────────────
// Purpose: figure out WHY /skincare and product-detail pages sometimes render
// "greyed out" for real visitors — the signature of fonts / hero video /
// product images / the product fetch all stalling (typically a flaky in-app
// browser or a throttled mobile connection).
//
// HOW YOU SEE THE DATA: every signal is pushed to Microsoft Clarity as a
// CUSTOM TAG (`clarity("set", key, value)`) or a SMART EVENT
// (`clarity("event", name)`). In the Clarity dashboard you can then FILTER /
// segment sessions by these — e.g. "show me sessions where font_status_6s =
// loading" or "where diag_imgs_incomplete fired" — and open the recording to
// see exactly what that visitor saw. Everything is ALSO console.log'd (prefix
// below) for local dev and remote debugging.
//
// FULLY GUARDED: if Clarity never loaded (fully stalled JS) or we're on the
// server, every call is a silent no-op — this instrumentation can never itself
// break a page.

const PREFIX = "[amneh-diag]";

type TagValue = string | number | boolean | null | undefined;

// Clarity's global is installed by components/MicrosoftClarity.tsx. Before the
// tag script finishes loading it's a stub that QUEUES calls (c.q) and replays
// them once loaded, so tags set early aren't lost. If it's genuinely absent
// (Clarity skipped on localhost, or JS fully stalled) we get null and no-op.
function clarity(): ((...args: unknown[]) => void) | null {
  if (typeof window === "undefined") return null;
  const c = (window as unknown as { clarity?: unknown }).clarity;
  return typeof c === "function" ? (c as (...args: unknown[]) => void) : null;
}

/** Set a filterable custom tag on the current Clarity session. */
export function diagTag(key: string, value: TagValue): void {
  const v = value === undefined || value === null ? "unknown" : String(value);
  try {
    clarity()?.("set", key, v);
  } catch {
    /* never let telemetry throw */
  }
  try {
    console.log(`${PREFIX} ${key}=${v}`);
  } catch {
    /* no-op */
  }
}

/** Fire a named Clarity smart-event (filterable/segmentable in the dashboard). */
export function diagEvent(name: string): void {
  try {
    clarity()?.("event", name);
  } catch {
    /* no-op */
  }
  try {
    console.log(`${PREFIX} event:${name}`);
  } catch {
    /* no-op */
  }
}

// Which in-app browser (if any) injected this session. These are the contexts
// where fonts/media stall most and where the injected `webkit.messageHandlers`
// probe error comes from — so tagging it lets us correlate the greying with it.
function detectInAppBrowser(ua: string): string {
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return "tiktok";
  if (/Snapchat/i.test(ua)) return "snapchat";
  if (/Pinterest/i.test(ua)) return "pinterest";
  if (/Line\//i.test(ua)) return "line";
  if (/Twitter/i.test(ua)) return "twitter";
  if (/GSA\//i.test(ua)) return "google-app";
  if (/\bWhatsApp\b/i.test(ua)) return "whatsapp";
  return "no";
}

// Capture-phase resource-error listener. IMPORTANT: failed loads of <img>,
// <video>, <source>, <link> and <script> do NOT bubble and are invisible to a
// normal window.onerror — they only surface on the CAPTURE phase. This is what
// pinpoints WHICH asset failed (the hero video, a product image, the font CSS),
// which is the direct cause of a grey placeholder staying on screen.
let resourceCaptureInstalled = false;
function installResourceErrorCapture(page: string): void {
  if (typeof window === "undefined" || resourceCaptureInstalled) return;
  resourceCaptureInstalled = true;
  window.addEventListener(
    "error",
    (e: Event) => {
      const t = e.target as (HTMLElement & { src?: string; href?: string; currentSrc?: string }) | null;
      // A JS error has no element target (target === window) — ignore those here.
      if (!t || !t.tagName) return;
      const tag = t.tagName.toUpperCase();
      if (tag === "IMG" || tag === "VIDEO" || tag === "SOURCE" || tag === "LINK" || tag === "SCRIPT") {
        const src = t.currentSrc || t.src || t.href || "unknown";
        // Trim to keep the tag readable; the path is enough to identify the asset.
        const short = src.length > 120 ? src.slice(0, 120) + "…" : src;
        diagTag(`res_error_${tag.toLowerCase()}`, short);
        diagEvent(`diag_resource_error_${page}`);
      }
    },
    true, // capture phase — required to see non-bubbling resource errors
  );
}

/**
 * Capture the environment for the current session: in-app browser, the iOS
 * WebKit bridge presence, effective network quality, and viewport. Call once
 * per page load. `page` scopes the signals ("skincare" | "product").
 */
export function diagEnvironment(page: string): void {
  if (typeof window === "undefined") return;
  installResourceErrorCapture(page);

  diagTag("diag_page", page);

  const ua = navigator.userAgent || "";
  diagTag("env_inapp_browser", detectInAppBrowser(ua));
  diagTag(
    "env_webkit_bridge",
    (window as unknown as { webkit?: { messageHandlers?: unknown } }).webkit?.messageHandlers
      ? "yes"
      : "no",
  );

  // navigator.connection is non-standard but present on Chromium/Android — the
  // majority of the mobile traffic here — and is the single best signal for
  // "this visitor is on a slow/degraded link", which is the leading cause of
  // the stalled-media greying.
  const conn = (
    navigator as unknown as {
      connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
    }
  ).connection;
  if (conn) {
    diagTag("net_effective_type", conn.effectiveType); // '4g' | '3g' | '2g' | 'slow-2g'
    diagTag("net_downlink_mbps", conn.downlink);
    diagTag("net_rtt_ms", conn.rtt);
    diagTag("net_save_data", conn.saveData);
  } else {
    diagTag("net_effective_type", "unavailable");
  }

  diagTag("view_size", `${window.innerWidth}x${window.innerHeight}`);
  diagTag("view_dpr", window.devicePixelRatio);
}

/**
 * Track font loading. The "tofu" boxes seen in the announcement bar mean the
 * Inter web font never loaded — this tags when that happens and how long it
 * took when it succeeds.
 */
export function diagFonts(): void {
  if (typeof document === "undefined") return;
  const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
  if (!fonts) {
    diagTag("font_api", "unavailable");
    return;
  }
  diagTag("font_status_initial", fonts.status); // 'loading' | 'loaded'
  const started = perfNow();
  fonts.ready
    .then(() => {
      diagTag("font_status_ready", "loaded");
      diagTag("font_ready_ms", Math.round(perfNow() - started));
    })
    .catch(() => diagTag("font_status_ready", "error"));
}

/**
 * Delayed audit: after `delayMs`, count how many images on the page never
 * finished decoding (still incomplete / zero natural width) and the font
 * status. A non-zero incomplete count is the direct, measurable definition of
 * the "greyed out" state — placeholders sitting where media should be.
 */
export function diagRenderAudit(page: string, delayMs = 6000): void {
  if (typeof window === "undefined") return;
  window.setTimeout(() => {
    try {
      const imgs = Array.from(document.images);
      const incomplete = imgs.filter((i) => !i.complete || i.naturalWidth === 0);
      diagTag("imgs_total", imgs.length);
      diagTag("imgs_incomplete", incomplete.length);
      if (incomplete.length > 0) {
        diagEvent(`diag_imgs_incomplete_${page}`);
        // First couple of stuck images — usually enough to identify the culprit.
        incomplete.slice(0, 3).forEach((img, i) => {
          const src = img.currentSrc || img.src || "unknown";
          diagTag(`img_stuck_${i}`, src.length > 120 ? src.slice(0, 120) + "…" : src);
        });
      }

      const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
      if (fonts) diagTag("font_status_final", fonts.status);
    } catch {
      /* no-op */
    }
  }, delayMs);
}

function perfNow(): number {
  try {
    return performance.now();
  } catch {
    return 0;
  }
}
