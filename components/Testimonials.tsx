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

// ── Horizontal scroller with a "there's more →" affordance ─────────────────
// A bare overflow-x row gives no signal that it scrolls — a shopper on mobile
// can easily assume what's on screen is all there is. This wraps the row with:
//   • a right-edge fade + a gently nudging chevron that says "swipe for more",
//   • a matching left-edge fade once you've started scrolling,
// both of which fade out automatically at the corresponding end — and never
// appear at all if the content already fits (nothing to scroll to). The cue is
// pointer-events-none so it never steals a tap from a card (e.g. tap-to-unmute).
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
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

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

      {/* Right fade + nudging chevron — "more this way", hidden at the end */}
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#faf1f4] to-transparent transition-opacity duration-300 ${atEnd ? "opacity-0" : "opacity-100"}`}
      />
      <motion.div
        aria-hidden
        animate={atEnd ? { opacity: 0 } : { opacity: 1, x: [0, 5, 0] }}
        transition={atEnd ? { duration: 0.3 } : { x: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#5f3d4e] shadow-[0_4px_14px_rgba(95,61,78,0.25)] backdrop-blur-sm"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </motion.div>
    </div>
  );
}

// ── Trimmed UGC video ────────────────────────────────────────────────────
// Plays ONLY the [startSec, endSec] slice of the source video and loops
// within it — so a long reel can be shown as just its best 10 seconds
// without ever editing the file. Muted autoplay (browsers require muted to
// autoplay); tapping unmutes so a shopper can hear the testimonial.
function UgcVideoCard({ video }: { video: UgcVideo }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  // Hidden until the video is actually positioned AND rendered at startSec.
  // Without this, seeking to a non-zero start forces the browser to buffer up
  // to that point while the card's background shows through — which looked
  // like a black screen "waiting" for `startSec` seconds before playback.
  const [ready, setReady] = useState(false);
  // PERF: don't download/decode until the card is near the viewport, and only
  // PLAY while it's actually visible. Before this, all 7 cards used
  // preload="auto" AND every one called play() — so opening the page fetched 7
  // full Shopify videos and ran 7 decoders at once, janking the whole site.
  // `load` (near viewport) gates the <video> mounting at all; `active` (mostly
  // on screen) gates play/pause. Once loaded it stays mounted so scrolling back
  // doesn't re-buffer — only playback toggles.
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
    if (v) v.currentTime = start;
  };

  // Reveal only once the video is genuinely sitting at `start` with a frame
  // ready — so the first thing shown is the startSec frame, never a black
  // buffering gap. Play only if the card is currently on screen.
  const tryReveal = () => {
    const v = ref.current;
    if (!v || ready) return;
    if (Math.abs(v.currentTime - start) < 0.3) {
      setReady(true);
      if (active) v.play().catch(() => {});
    }
  };

  // Play/pause as the card enters/leaves the screen (once it's loaded + ready).
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active && ready) v.play().catch(() => {});
    else if (!active) v.pause();
  }, [active, ready]);

  // Safety net: never leave a permanent spinner if media events don't fire —
  // reveal ~4s after we START loading (not on mount), and only auto-play if
  // the card is on screen at that point.
  useEffect(() => {
    if (!load) return;
    const t = setTimeout(() => {
      setReady((r) => {
        if (!r && active) ref.current?.play().catch(() => {});
        return true;
      });
    }, 4000);
    return () => clearTimeout(t);
  }, [load, active]);

  const clampToSegment = () => {
    const v = ref.current;
    if (!v) return;
    const end = video.endSec ?? v.duration;
    if (v.currentTime >= end || v.currentTime < start - 0.05) {
      v.currentTime = start;
      if (active) v.play().catch(() => {});
    }
  };

  return (
    <div ref={wrapRef} className="relative w-[62vw] max-w-[240px] sm:w-[240px] flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-gradient-to-br from-[#dff0f8] to-[#fbeef2] shadow-[0_14px_36px_rgba(95,61,78,0.14)] aspect-[9/16]">
      {/* Soft brand placeholder + subtle spinner while the start frame loads —
          replaces the old black flash. */}
      {!ready && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center">
          <span className="h-6 w-6 rounded-full border-2 border-[#5f3d4e]/30 border-t-[#5f3d4e] animate-spin" />
        </div>
      )}
      {load && (
        <video
          ref={ref}
          src={video.url}
          // Only starts once the card is near the viewport (see `load`), so
          // off-screen cards cost nothing until you approach them. "metadata"
          // (not "auto") streams the trimmed segment via a range request instead
          // of buffering from byte 0 — less data, faster reveal.
          preload="metadata"
          poster={video.poster}
          muted={muted}
          loop
          playsInline
          onLoadedMetadata={seekToStart}
          onSeeked={tryReveal}
          onCanPlay={tryReveal}
          onTimeUpdate={clampToSegment}
          onClick={() => setMuted((m) => !m)}
          className={`aspect-[9/16] w-full object-cover cursor-pointer transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {/* Mute/unmute hint */}
      <button
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute bottom-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
      >
        {muted ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.7-.63-1.77-1.5a54 54 0 0 1 0-4.06c.07-.87.89-1.5 1.77-1.5h2.24Z"/></svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.7-.63-1.77-1.5a54 54 0 0 1 0-4.06c.07-.87.89-1.5 1.77-1.5h2.24Z"/></svg>
        )}
      </button>
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
