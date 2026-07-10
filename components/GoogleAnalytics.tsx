"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Loads Google Analytics 4 (gtag.js) and sends a page_view on every route
// change. This is what powers GA's "Realtime" report — the live count of
// visitors currently on the site, broken down by which page they're on —
// which is what Shopify's checkout-only live view doesn't cover. View it at
// analytics.google.com → Reports → Realtime, once NEXT_PUBLIC_GA_MEASUREMENT_ID
// is set. Renders nothing (and loads nothing) until that env var is set.
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const firstLoad = useRef(true);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
    // The base config call below already sends the first page_view; only
    // fire on subsequent client-side navigations.
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    (window as any).gtag?.("event", "page_view", {
      page_path: pathname,
    });
  }, [pathname]);

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
