"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { loadPostHog } from "@/lib/posthog";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
// Default to EU cloud; override with NEXT_PUBLIC_POSTHOG_HOST if your project
// is on US cloud (https://us.i.posthog.com) or a self-hosted instance.
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

// Loads PostHog — session replays, heatmaps, autocapture, and funnel events.
// Renders nothing (and loads nothing) until NEXT_PUBLIC_POSTHOG_KEY is set, so
// this is a safe no-op until you paste your project key into .env. View data
// at the PostHog dashboard once it's collecting.
//
// App Router is a SPA after first load, so we init with capture_pageview off
// and fire $pageview ourselves on every route change (same approach as
// MetaPixel) — otherwise PostHog would only ever record the first page.
function PostHogPageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  // Init once, on mount — deferred to window `load` (with a fallback timer)
  // so the ~75KB posthog-js fetch doesn't compete with the page's own
  // content for bandwidth right after hydration. Same reasoning as the Meta
  // Pixel/gtag deferrals: this is fire-and-forget telemetry, not something a
  // shopper is waiting on.
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    // Skip localhost — otherwise local dev sessions pollute the same project
    // as real visitors.
    if (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) return;

    let done = false;
    const boot = () => {
      if (done || initialized.current) return;
      done = true;
      loadPostHog().then((posthog) => {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          capture_pageview: false, // fired manually below for App Router
          capture_pageleave: true,
          persistence: "localStorage+cookie",
        });
        initialized.current = true;
        // The pathname effect below may have already run once before init
        // finished — fire the missed first $pageview now.
        let url = window.origin + pathname;
        const qs = searchParams?.toString();
        if (qs) url += `?${qs}`;
        posthog.capture("$pageview", { $current_url: url });
      });
    };

    if (document.readyState === "complete") {
      boot();
    } else {
      window.addEventListener("load", boot, { once: true });
      const fallback = setTimeout(boot, 4000);
      return () => {
        window.removeEventListener("load", boot);
        clearTimeout(fallback);
      };
    }
    // Only re-run for a genuinely new key — pathname changes are handled by
    // the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire a $pageview on every subsequent client-side navigation (the initial
  // one is sent by the init boot above, once loading finishes).
  useEffect(() => {
    if (!POSTHOG_KEY || !initialized.current) return;
    loadPostHog().then((posthog) => {
      let url = window.origin + pathname;
      const qs = searchParams?.toString();
      if (qs) url += `?${qs}`;
      posthog.capture("$pageview", { $current_url: url });
    });
  }, [pathname, searchParams]);

  return null;
}

export default function PostHog() {
  if (!POSTHOG_KEY) return null;
  // useSearchParams must be inside Suspense in the App Router.
  return (
    <Suspense fallback={null}>
      <PostHogPageviews />
    </Suspense>
  );
}
