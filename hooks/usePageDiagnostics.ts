import { useEffect } from "react";
import { diagEnvironment, diagEvent, diagFonts, diagRenderAudit, diagTag } from "@/lib/diag";

// Wires up all page diagnostics from a single call inside a client component.
//
// The mere fact this effect RUNS is itself the most important signal: it proves
// React hydrated on this session. Pages here are server-rendered so content
// paints without JS, but the interactive bits (product fetch fallback, hero
// video, reveal animations, carousels) only work once hydrated. When a session
// is greyed-out AND we never see `diag_hydrated_<page>` fire, JS never ran at
// all — a very different diagnosis from "JS ran but the images stalled".
//
// Call once near the top of a page's client component:
//   usePageDiagnostics("skincare");
export function usePageDiagnostics(page: string): void {
  useEffect(() => {
    diagEvent(`diag_hydrated_${page}`);
    diagTag("diag_hydrated", page);

    // Time from navigation start to hydration — high values track with the
    // slow connections that leave media stalled.
    try {
      diagTag("hydrate_ms", Math.round(performance.now()));
    } catch {
      /* no-op */
    }

    diagEnvironment(page);
    diagFonts();
    diagRenderAudit(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
