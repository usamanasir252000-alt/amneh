"use client";

import { useEffect, useRef, useState } from "react";
import type { UgcVideo } from "@/lib/testimonials";

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
}: {
  video: UgcVideo;
  zoom?: boolean; // desktop scale-in-on-reveal effect
  eager?: boolean; // start fetching immediately on mount (for hero/banner videos)
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
  const start = video.startSec ?? 0;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setLoad(true);
        setActive(e.isIntersecting);
      },
      { root: null, rootMargin: "400px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const seekToStart = () => {
    const v = ref.current;
    if (v) v.currentTime = start;
  };

  const tryReveal = () => {
    const v = ref.current;
    if (!v || ready) return;
    if (Math.abs(v.currentTime - start) < 0.3) {
      setReady(true);
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
        if (!r && active) ref.current?.play().catch(() => {});
        return true;
      });
    }, 3500);
    return () => clearTimeout(t);
  }, [load, active]);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      {!ready && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#dff0f8] to-[#fbeef2]" />
      )}
      {load && (
        <video
          ref={ref}
          src={video.url}
          // "metadata" (not "auto"): with a trimmed clip that starts partway in
          // (e.g. startSec 21), "auto" wastefully buffers from byte 0 up to the
          // start point before anything shows. "metadata" loads just the header,
          // then seeking range-requests straight to the segment — far less data,
          // much faster to first frame. CDN supports range requests.
          preload="metadata"
          poster={video.poster}
          muted
          loop
          playsInline
          onLoadedMetadata={seekToStart}
          onSeeked={tryReveal}
          onCanPlay={tryReveal}
          onTimeUpdate={clampToSegment}
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
