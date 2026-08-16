"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { fbTrack, fbSetAdvancedMatching, loadMetaPixel } from "@/lib/fbpixel";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Boots the Meta Pixel and fires PageView on every route, including the first
// load. The pixel is initialised via loadMetaPixel() (lib/fbpixel.ts) rather
// than an inline <Script> snippet so the ordering is guaranteed: match ids
// (_fbp/_fbc/_eid, incl. capturing ?fbclid on the landing page) are resolved
// BEFORE fbq('init'), and external_id rides on the init itself — so even the
// first PageView carries it. Routing every PageView through fbTrack also gives
// it an eventID + a CAPI server twin, same as the funnel events.
// Renders nothing (and loads nothing) until NEXT_PUBLIC_META_PIXEL_ID is set.
export default function MetaPixel() {
  const pathname = usePathname();
  const booted = useRef(false);
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!PIXEL_ID) return;

    if (!booted.current) {
      booted.current = true;
      // Defer the initial boot (which appends the ~107KB fbevents.js script
      // tag) until the window `load` event, i.e. after the page's own
      // content has finished downloading — same reasoning as gtag.js's
      // lazyOnload switch in GoogleAnalytics.tsx: on a slow connection, this
      // ~107KB fetch was competing with the page itself for bandwidth right
      // when a visitor is waiting for their click to resolve. A fixed
      // fallback timer covers the case where `load` is held up indefinitely
      // (e.g. a stalled below-the-fold video) — the boot must still happen.
      let done = false;
      const boot = () => {
        if (done) return;
        done = true;
        loadMetaPixel();
        lastTracked.current = pathname;
        fbTrack("PageView");
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
      return;
    }

    // Guard against double-fires for the same path (React StrictMode runs
    // effects twice in dev; remounts must not double-count a PageView).
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    fbTrack("PageView");
  }, [pathname]);

  // Advanced Matching for already-logged-in visitors: re-init the pixel with
  // their email/name on load. Covers returning customers who don't touch the
  // login form this session. Guests who log in/sign up are covered at the
  // form (AuthModal + /login + /signup).
  useEffect(() => {
    if (!PIXEL_ID) return;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (u?.email) fbSetAdvancedMatching({ em: u.email, fn: u.firstName, ln: u.lastName });
      })
      .catch(() => {});
  }, []);

  return null;
}
