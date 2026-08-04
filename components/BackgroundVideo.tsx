"use client";

import { useEffect, useRef, useState } from "react";
import type { UgcVideo } from "@/lib/testimonials";
import { diagEvent, diagTag } from "@/lib/diag";

// Absolute-fill, silent, looping background video that plays ONLY the
// [startSec, endSec] slice and never shows a black buffering gap. Shared by
// the homepage FeatureSplit panel and the /skincare hero banner.
//
// The no-black-flash trick: eager-load the data, seek to startSec, and keep
// the video hidden behind a soft brand-gradient placeholder until it's
// genuinely sitting at that frame — only then reveal + play. Without this,
// seeking into a video forces buffering during which the container shows
// through as black, proportional to how far in startSec is.
export default function BackgroundVideo({
  video,
  zoom = false,
  eager = false,
  loadDelayMs = 0,
  waitForWindowLoad = false,
  diagLabel,
}: {
  video: UgcVideo;
  zoom?: boolean; // desktop scale-in-on-reveal effect
  eager?: boolean; // start fetching immediately on mount (for hero/banner videos)
  // Wait this long AFTER the panel is in view before fetching the video, so
  // higher-priority above-the-fold content (e.g. the /skincare product images)
  // wins the bandwidth first. Safe to use ONLY with a poster set — the poster
  // covers the delay so the visitor still sees a real image immediately.
  loadDelayMs?: number;
  // Don't fetch the video until the window `load` event has fired — i.e. every
  // image on the page is done downloading. A fixed loadDelayMs guesses how long
  // the important content needs; this waits for it exactly (same trick that
  // keeps the PDP popup video from competing with product images). Falls back
  // to a timer in case `load` is held up indefinitely. Poster required, same as
  // loadDelayMs.
  waitForWindowLoad?: boolean;
  // Opt-in diagnostics. When set (e.g. "skincare-hero"), this instance reports
  // whether the video actually reached its frame or only revealed via the 3.5s
  // safety fallback (= it never really loaded, so the grey placeholder was what
  // the visitor saw). Omitted elsewhere so other instances stay silent.
  diagLabel?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  // PERF: by default don't fetch the video until this panel is near the
  // viewport, and pause it while off screen — so a below-the-fold instance (the
  // homepage FeatureSplit) costs nothing on initial load. `eager` overrides
  // that to start fetching the moment it mounts, so hero/banner videos that are
  // the first thing a visitor sees are ready instantly instead of loading in.
  const [load, setLoad] = useState(eager);
  const [active, setActive] = useState(eager);
  // True once the window load event has fired (or immediately when
  // waitForWindowLoad is off). Gates the video fetch, never the poster.
  const [winReady, setWinReady] = useState(!waitForWindowLoad);
  const start = video.startSec ?? 0;

  useEffect(() => {
    if (!waitForWindowLoad) return;
    if (document.readyState === "complete") {
      setWinReady(true);
      return;
    }
    const onLoad = () => setWinReady(true);
    window.addEventListener("load", onLoad, { once: true });
    // Safety: a stalled straggler image must not block the video forever.
    const fallback = setTimeout(() => setWinReady(true), 6000);
    return () => {
      window.removeEventListener("load", onLoad);
      clearTimeout(fallback);
    };
  }, [waitForWindowLoad]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    const obs = new IntersectionObserver(
      ([e]) => {
        // winReady gates the FETCH only (visibility tracking still runs).
        // Re-created when winReady flips, and observe() re-fires with the
        // current intersection, so a panel already in view starts loading the
        // moment the window finishes.
        if (e.isIntersecting && winReady) {
          // Defer the fetch by loadDelayMs (if set) so higher-priority content
          // downloads first; the poster covers the gap. Fire once — clear any
          // pending timer so we never schedule twice.
          if (loadDelayMs > 0) {
            if (!delayTimer) delayTimer = setTimeout(() => setLoad(true), loadDelayMs);
          } else {
            setLoad(true);
          }
        }
        setActive(e.isIntersecting);
      },
      { root: null, rootMargin: "400px", threshold: 0 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [loadDelayMs, winReady]);

  const seekToStart = () => {
    const v = ref.current;
    if (v) v.currentTime = start;
  };

  const tryReveal = () => {
    const v = ref.current;
    if (!v || ready) return;
    if (Math.abs(v.currentTime - start) < 0.3) {
      setReady(true);
      if (diagLabel) diagEvent(`diag_video_ready_${diagLabel}`);
      if (active) v.play().catch(() => {});
    }
  };

  const clampToSegment = () => {
    const v = ref.current;
    if (!v) return;
    const end = video.endSec ?? v.duration;
    if (v.currentTime >= end || v.currentTime < start - 0.05) {
      v.currentTime = start;
      if (active) v.play().catch(() => {});
    }
  };

  // Play/pause with visibility (once loaded + ready).
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active && ready) v.play().catch(() => {});
    else if (!active) v.pause();
  }, [active, ready]);

  // Reveal ~3.5s after we START loading, even if media events don't fire.
  useEffect(() => {
    if (!load) return;
    const t = setTimeout(() => {
      setReady((r) => {
        if (!r) {
          // Revealed by the safety timer, not by the video reaching its frame:
          // the video never genuinely loaded, so the grey gradient placeholder
          // is what the visitor was looking at until now.
          if (diagLabel) diagEvent(`diag_video_fallback_reveal_${diagLabel}`);
          if (active) ref.current?.play().catch(() => {});
        }
        return true;
      });
    }, 3500);
    return () => clearTimeout(t);
  }, [load, active]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      {!ready &&
        (video.poster ? (
          // Poster = instant real image while the .mp4 downloads. Plain <img>
          // (not next/image) on purpose: it skips the /_next/image server proxy
          // so it paints as fast as possible — the whole point on a slow in-app
          // browser. fetchPriority high because this IS the hero LCP until the
          // video takes over.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.poster}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#dff0f8] to-[#fbeef2]" />
        ))}
      {load && (
        <video
          ref={ref}
          src={video.url}
          // Eager (above-the-fold hero): "auto" — these are small pre-trimmed
          // local files that start at frame 0, so downloading the whole thing
          // right away is cheap and gives an instant start. Lazy (below fold):
          // "metadata" so it doesn't compete with the initial page load; it only
          // begins loading once scrolled near, then plays quickly (also frame 0,
          // faststart). The old "auto on a seek-to-21s Shopify clip" is exactly
          // what made the hero buffer forever.
          preload={eager ? "auto" : "metadata"}
          poster={video.poster}
          muted
          loop
          playsInline
          onLoadedMetadata={seekToStart}
          onSeeked={tryReveal}
          onCanPlay={tryReveal}
          onTimeUpdate={clampToSegment}
          onError={() => {
            if (diagLabel) {
              diagTag(`video_error_${diagLabel}`, video.url);
              diagEvent(`diag_video_error_${diagLabel}`);
            }
          }}
          className="absolute inset-0 h-full w-full object-cover object-center"
          style={{
            opacity: ready ? 1 : 0,
            transform: zoom ? (ready ? "scale(1)" : "scale(1.06)") : undefined,
            transition: zoom
              ? "opacity 500ms ease, transform 1100ms cubic-bezier(0.16, 1, 0.3, 1) 100ms"
              : "opacity 500ms ease",
          }}
        />
      )}
    </div>
  );
}
