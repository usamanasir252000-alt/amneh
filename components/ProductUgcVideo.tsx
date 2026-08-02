"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { UgcVideo } from "@/lib/testimonials";

// Per-product UGC video, shown as a small dismissable popup tucked into the
// white space of the product image, that expands to a full player on tap.
// Always muted (the clips have no audio). Sourced from the Shopify metafield
// custom.ugc_video — value is a
// video URL, optionally trimmed: "url" or "url | startSec | endSec".

function parseProductVideo(raw: string): UgcVideo | null {
  const parts = raw.split("|").map((s) => s.trim());
  const url = parts[0];
  if (!url) return null;
  const s = parts[1] ? parseFloat(parts[1]) : NaN;
  const e = parts[2] ? parseFloat(parts[2]) : NaN;
  return {
    url,
    startSec: Number.isFinite(s) ? s : undefined,
    endSec: Number.isFinite(e) ? e : undefined,
  };
}

// Silent-by-default trim player: plays only [startSec, endSec] and loops within
// it, revealing only once it's sitting on the start frame (no black flash).
function TrimVideo({
  video,
  muted,
  className,
  onClick,
}: {
  video: UgcVideo;
  muted: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const start = video.startSec ?? 0;

  const seekToStart = () => {
    const v = ref.current;
    if (v) v.currentTime = start;
  };
  const tryReveal = () => {
    const v = ref.current;
    if (!v || ready) return;
    if (v.currentTime >= start - 0.3) setReady(true);
  };

  // Kick playback immediately on mount (muted autoplay is allowed). play() is
  // what forces the browser to buffer past preload="metadata" and fire the
  // frame events that reveal the video — waiting for canplay BEFORE calling
  // play() deadlocked on some browsers: the spinner timed out and the card
  // stayed blank.
  useEffect(() => {
    ref.current?.play().catch(() => {});
  }, []);
  const clampToSegment = () => {
    const v = ref.current;
    if (!v) return;
    const end = video.endSec ?? v.duration;
    if (v.currentTime >= end || v.currentTime < start - 0.05) {
      v.currentTime = start;
      v.play().catch(() => {});
    }
  };

  useEffect(() => {
    const t = setTimeout(
      () => setReady((r) => { if (!r) ref.current?.play().catch(() => {}); return true; }),
      3500
    );
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#dff0f8] to-[#fbeef2]">
          <span className="h-5 w-5 rounded-full border-2 border-[#5f3d4e]/30 border-t-[#5f3d4e] animate-spin" />
        </div>
      )}
      <video
        ref={ref}
        src={video.url}
        // metadata + seek-to-start range-request instead of buffering from 0 —
        // faster to the trimmed segment, less bandwidth.
        preload="metadata"
        muted={muted}
        loop
        playsInline
        onLoadedMetadata={seekToStart}
        onSeeked={tryReveal}
        onCanPlay={tryReveal}
        onPlaying={tryReveal}
        onTimeUpdate={clampToSegment}
        onClick={onClick}
        className={`${className ?? ""} transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}

export default function ProductUgcVideo({
  raw,
  productId,
  start,
  end,
}: {
  raw: string;
  productId: string;
  // Optional trim (seconds) from dedicated Shopify metafields
  // custom.ugc_video_start / custom.ugc_video_end. When set, these override any
  // trim baked into the `raw` "url | start | end" value.
  start?: number | null;
  end?: number | null;
}) {
  const parsed = parseProductVideo(raw);
  const video = parsed
    ? {
        ...parsed,
        startSec: Number.isFinite(start as number) ? (start as number) : parsed.startSec,
        endSec: Number.isFinite(end as number) ? (end as number) : parsed.endSec,
      }
    : null;
  // Start hidden; a client effect decides whether to show (avoids SSR flash and
  // respects a prior dismissal for THIS product this session).
  const [dismissed, setDismissed] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  // PERF: gate the popup (and therefore its <video>) until the page — hero
  // image included — has finished loading. This clip is a 3-7 MB Shopify CDN
  // file; fetching it eagerly on mount raced the product photo for bandwidth
  // and made the image take 10s+ on mobile connections. The popup simply
  // animates in a beat after the page settles instead.
  const [pageLoaded, setPageLoaded] = useState(false);
  const KEY = `amneh:ugc-dismissed:${productId}`;

  useEffect(() => {
    setMounted(true);
    let closed = false;
    try { closed = sessionStorage.getItem(KEY) === "1"; } catch {}
    if (!closed) setDismissed(false);
  }, [KEY]);

  useEffect(() => {
    const show = () => setPageLoaded(true);
    if (document.readyState === "complete") {
      const t = setTimeout(show, 300);
      return () => clearTimeout(t);
    }
    window.addEventListener("load", show, { once: true });
    // Fallback: never wait forever if some slow third-party asset stalls the
    // load event.
    const t = setTimeout(show, 6000);
    return () => { clearTimeout(t); window.removeEventListener("load", show); };
  }, []);

  // Lock body scroll while expanded.
  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [expanded]);

  if (!video) return null;

  const close = () => {
    setDismissed(true);
    try { sessionStorage.setItem(KEY, "1"); } catch {}
  };

  return (
    <>
      {/* Mini floating popup — tucked bottom-left over the image's white space */}
      <AnimatePresence>
        {mounted && pageLoaded && !dismissed && !expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute bottom-3 left-3 z-20 w-[108px] sm:w-[124px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
              aria-label="Watch video"
              className="relative block aspect-[9/16] w-full overflow-hidden rounded-xl bg-black shadow-[0_10px_28px_rgba(0,0,0,0.3)] ring-2 ring-white active:scale-95 transition-transform"
            >
              <TrimVideo video={video} muted className="absolute inset-0 h-full w-full object-cover" />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/85 shadow">
                  <svg className="h-3.5 w-3.5 translate-x-[1px] text-[#5f3d4e]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
              <span className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[8.5px] font-bold uppercase tracking-wide text-white drop-shadow">
                Watch
              </span>
            </button>
            {/* Close */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); close(); }}
              aria-label="Close video"
              className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-white shadow-md active:scale-90 transition-transform"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded full player (muted), portaled to body so it's truly fullscreen */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="relative aspect-[9/16] max-h-[85vh] w-full max-w-[360px] overflow-hidden rounded-2xl bg-black"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TrimVideo video={video} muted className="absolute inset-0 h-full w-full object-contain" />
                </motion.div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                  aria-label="Close"
                  className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
