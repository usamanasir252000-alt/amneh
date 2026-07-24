"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { fbTrack, fbSetAdvancedMatching, getExternalId } from "@/lib/fbpixel";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Loads the Meta Pixel base script and fires PageView on every route change.
// Renders nothing (and loads nothing) until NEXT_PUBLIC_META_PIXEL_ID is set.
export default function MetaPixel() {
  const pathname = usePathname();
  const firstLoad = useRef(true);

  useEffect(() => {
    if (!PIXEL_ID) return;
    // The base snippet already fires the first PageView on load; only fire on
    // subsequent client-side navigations.
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    fbTrack("PageView");
  }, [pathname]);

  // Seed the pixel with the first-party external_id (works for everyone,
  // logged in or guest) so the pixel event and its CAPI twin carry the same
  // match key. Sent raw on both sides — see lib/meta-capi.ts.
  useEffect(() => {
    if (!PIXEL_ID) return;
    const externalId = getExternalId();
    if (externalId) fbSetAdvancedMatching({ external_id: externalId });
  }, []);

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

  if (!PIXEL_ID) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  );
}
