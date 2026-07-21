"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { posthog } from "@/lib/posthog";

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

  // Init once, on mount.
  useEffect(() => {
    if (!POSTHOG_KEY || initialized.current) return;
    // Skip localhost — otherwise local dev sessions pollute the same project
    // as real visitors.
    if (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) return;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false, // fired manually below for App Router
      capture_pageleave: true,
      persistence: "localStorage+cookie",
    });
    initialized.current = true;
  }, []);

  // Fire a $pageview on first load and every client-side navigation.
  useEffect(() => {
    if (!POSTHOG_KEY || !initialized.current) return;
    let url = window.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;
    posthog.capture("$pageview", { $current_url: url });
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
