"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { UGC_VIDEOS, type UgcVideo } from "@/lib/testimonials";

interface Review {
  id: string | number;
  name: string;
  rating: number;
  text: string;
}

// ── Horizontal scroller with working prev/next arrows ──────────────────────
// A bare overflow-x row gives no signal that it scrolls — a shopper on mobile
// can easily assume what's on screen is all there is. This wraps the row with:
//   • edge fades that say "there's more this way",
//   • a real arrow button on each edge, which advances the row by one card.
// All of it hides automatically at the corresponding end, and never appears at
// all if the content already fits (nothing to scroll to).
//
// The arrows used to be `pointer-events-none` decoration — they looked exactly
// like buttons but swallowed nothing and did nothing, so tapping one appeared
// broken and only swiping worked. They're <button>s now. Only the fades stay
// pointer-events-none, so they can't steal a tap from a card underneath.
function HScrollRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setAtStart(el.scrollLeft <= 2);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Cards can arrive/resize after mount (async reviews, video metadata), which
    // changes scrollWidth without firing scroll or resize — without this the
    // arrows would stay stuck at their initial "nothing to scroll" state.
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [children]);

  // One card per click, matched to the snap points so a click always lands on a
  // card edge rather than mid-card. Falls back to ~80% of the viewport width if
  // the row is somehow empty.
  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const arrowBase =
    "absolute top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#5f3d4e] shadow-[0_4px_14px_rgba(95,61,78,0.25)] backdrop-blur-sm transition-opacity duration-300 active:scale-90 hover:bg-white";

  return (
    <div className="relative">
      <div
        ref={ref}
        className={`flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-6 lg:px-10 ${className}`}
      >
        {children}
      </div>

      {/* Left fade — only once scrolled off the start */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#faf1f4] to-transparent transition-opacity duration-300 ${atStart ? "opacity-0" : "opacity-100"}`}
      />
      {/* Right fade — hidden at the end */}
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#faf1f4] to-transparent transition-opacity duration-300 ${atEnd ? "opacity-0" : "opacity-100"}`}
      />

      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label="Previous"
        className={`${arrowBase} left-3 ${atStart ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Nudges gently while there's more to see, so it still reads as "swipe
          this way" and not just a static control. */}
      <motion.button
        type="button"
        onClick={() => nudge(1)}
        aria-label="Next"
        animate={atEnd ? { x: 0 } : { x: [0, 5, 0] }}
        transition={atEnd ? { duration: 0.3 } : { x: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } }}
        className={`${arrowBase} right-3 ${atEnd ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>
    </div>
  );
}

// ── Trimmed UGC video ────────────────────────────────────────────────────
// Plays ONLY the [startSec, endSec] slice of the source video and loops
// within it — so a long reel can be shown as just its best 10 seconds
// without ever editing the file. Always muted — the trimmed clips have no
// audio track, so there's no mute/unmute control.
//
// LOADING MODEL: the poster JPG (the clip's own first frame, ~25 KB) renders
// unconditionally as a plain <img> under the video — it paints the instant the
// section appears, so there is never a spinner-over-gradient wait. The <video>
// mounts only near the viewport and fades in over the poster once it's
// actually PLAYING. The old version instead hid everything behind a spinner
// until a canplay/seeked event, then force-revealed after 4s — but with
// preload="metadata" those events often never fire before play(), so the
// spinner would stop and leave a blank card ("loader stops but no video").
function UgcVideoCard({ video }: { video: UgcVideo }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  // True once the video has genuinely rendered a frame at/past startSec —
  // gates only the poster→video crossfade, never what the shopper sees first.
  const [ready, setReady] = useState(false);
  // PERF: `load` (near viewport) gates mounting the <video> at all, so
  // off-screen cards cost zero bandwidth; `active` (≥50% on screen) gates
  // play/pause so ~1 decoder runs at a time. Once mounted it stays mounted, so
  // scrolling back doesn't re-buffer.
  const [load, setLoad] = useState(false);
  const [active, setActive] = useState(false);
  const start = video.startSec ?? 0;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // Start FETCHING a bit before the card is swiped in, so it feels instant.
    const loadObs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setLoad(true); },
      { root: null, rootMargin: "400px", threshold: 0 }
    );
    // Only PLAY the card that's genuinely on screen (limits to ~1 at a time).
    const playObs = new IntersectionObserver(
      ([e]) => setActive(e.isIntersecting && e.intersectionRatio >= 0.5),
      { root: null, rootMargin: "0px", threshold: [0, 0.5, 1] }
    );
    loadObs.observe(el);
    playObs.observe(el);
    return () => { loadObs.disconnect(); playObs.disconnect(); };
  }, []);

  const seekToStart = () => {
    const v = ref.current;
    if (v && start > 0) v.currentTime = start;
  };

  // Crossfade poster→video only once a real frame at `start` is showing.
  const tryReveal = () => {
    const v = ref.current;
    if (!v || ready) return;
    if (v.currentTime >= start - 0.3) setReady(true);
  };

  // Play/pause with visibility. Crucially, play() is NOT gated on `ready`:
  // calling play() is what forces the browser to buffer past `metadata` and
  // fire the frame events that set `ready` — gating it the other way round
  // deadlocked (the old blank-card bug).
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active, load]);

  const clampToSegment = () => {
    const v = ref.current;
    if (!v) return;
    tryReveal();
    const end = video.endSec ?? v.duration;
    if (v.currentTime >= end || v.currentTime < start - 0.05) {
      v.currentTime = start;
      if (active) v.play().catch(() => {});
    }
  };

  return (
    <div ref={wrapRef} className="relative w-[62vw] max-w-[240px] sm:w-[240px] flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-gradient-to-br from-[#dff0f8] to-[#fbeef2] shadow-[0_14px_36px_rgba(95,61,78,0.14)] aspect-[9/16]">
      {/* Poster: always rendered, paints instantly, sits under the video. */}
      {video.poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.poster}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        !ready && (
          <div className="absolute inset-0 z-[1] flex items-center justify-center">
            <span className="h-6 w-6 rounded-full border-2 border-[#5f3d4e]/30 border-t-[#5f3d4e] animate-spin" />
          </div>
        )
      )}
      {load && (
        <video
          ref={ref}
          src={video.url}
          // "metadata" keeps the initial fetch tiny; the play() call above is
          // what pulls the actual stream once the card is on screen.
          preload="metadata"
          poster={video.poster}
          muted
          loop
          playsInline
          onLoadedMetadata={seekToStart}
          onSeeked={tryReveal}
          onCanPlay={tryReveal}
          onPlaying={tryReveal}
          onTimeUpdate={clampToSegment}
          className={`relative aspect-[9/16] w-full object-cover transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {/* No mute/unmute control — the trimmed clips have no audio track. */}
      {video.name && (
        <span className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {video.name}
        </span>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const filled = Math.round(review.rating);
  return (
    <div className="w-[78vw] max-w-[320px] sm:w-[320px] flex-shrink-0 snap-start rounded-2xl border border-[#f0dde3] bg-white p-5 shadow-[0_10px_28px_rgba(95,61,78,0.08)]">
      <div className="flex gap-0.5 mb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} className={`h-3.5 w-3.5 ${i <= filled ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-sm leading-6 text-gray-600 line-clamp-6">&ldquo;{review.text}&rdquo;</p>
      <p className="mt-4 text-[13px] font-semibold text-gray-900">{review.name}</p>
      <p className="text-[11px] text-[#4d9ab5]">Verified buyer</p>
    </div>
  );
}

// Reusable "loved by real people" section — UGC video row + written review
// row. Auto-hides entirely when there's no content, so it never shows an
// empty shell. Reviews come live from Judge.me; videos from lib/testimonials.
export default function Testimonials({ className = "" }: { className?: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reviews")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        setReviews(
          data.filter(
            (r) => r && typeof r.text === "string" && r.text.trim() && Number(r.rating) >= 1
          )
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const hasVideos = UGC_VIDEOS.length > 0;
  const hasReviews = reviews.length > 0;
  if (!hasVideos && !hasReviews) return null;

  return (
    <section className={`bg-gradient-to-b from-white to-[#faf1f4] py-10 sm:py-14 border-t border-gray-200 ${className}`}>
      <div className="max-w-screen-xl mx-auto">
        <div className="px-6 lg:px-10">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#4d9ab5] font-semibold mb-2">Loved by real people</p>
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-gray-900 mb-6 sm:mb-8">
            Real Results, Real Reviews
          </h2>
        </div>

        {hasVideos && (
          <HScrollRow className="pb-3 mb-8">
            {UGC_VIDEOS.map((v, i) => (
              <UgcVideoCard key={i} video={v} />
            ))}
          </HScrollRow>
        )}

        {hasReviews && (
          <HScrollRow className="pb-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </HScrollRow>
        )}
      </div>
    </section>
  );
}
