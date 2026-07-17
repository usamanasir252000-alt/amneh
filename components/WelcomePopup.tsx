"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Shopify doesn't expose a "site-wide settings" field for something like
// this — upload the video in Admin → Content → Files, open it, copy its
// cdn.shopify.com URL, and paste it here.
const POPUP_VIDEO_URL = "/video/model_popup.mp4";

const SHOW_DELAY_MS = 2500;
// If the video hasn't finished buffering by this point (very slow
// connection), reveal the popup anyway rather than waiting indefinitely.
const MAX_WAIT_MS = 6000;
const SESSION_KEY = "amneh_welcome_popup_shown";

export default function WelcomePopup() {
  const [videoReady, setVideoReady] = useState(false);
  const [delayElapsed, setDelayElapsed] = useState(false);
  // null = not yet decided (during SSR/first render); the gate is read in an
  // effect because sessionStorage doesn't exist on the server.
  const [eligible, setEligible] = useState<boolean | null>(null);
  const router = useRouter();

  // Once per browser session — restored deliberately as a conversion fix.
  // Clarity showed real visitors leaving and returning within minutes; with
  // the every-visit behavior each return got the full-screen popup AGAIN,
  // interrupting people mid-consideration (popup fatigue is a well-known
  // conversion killer). Gating also means the 2.3MB video (the single
  // largest payload on the site) isn't re-downloaded on every homepage
  // load — the component renders nothing at all once shown this session.
  useEffect(() => {
    if (!POPUP_VIDEO_URL) return;
    let show = true;
    try {
      show = !sessionStorage.getItem(SESSION_KEY);
    } catch {
      // Storage blocked (some in-app browsers) — fall back to showing.
    }
    setEligible(show);
    if (!show) return;

    const delayTimer = setTimeout(() => setDelayElapsed(true), SHOW_DELAY_MS);
    const failsafeTimer = setTimeout(() => setVideoReady(true), MAX_WAIT_MS);
    return () => {
      clearTimeout(delayTimer);
      clearTimeout(failsafeTimer);
    };
  }, []);

  // Reveals only once BOTH the requested delay has passed AND the video has
  // actually buffered enough to play smoothly — whichever finishes last.
  const open = eligible === true && delayElapsed && videoReady;

  // Mark as shown the moment it actually opens (not on mount), so a visitor
  // who bounces before the 2.5s delay still gets it on their next page.
  useEffect(() => {
    if (!open) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}
  }, [open]);

  const close = () => setDelayElapsed(false);

  const handleShopNow = () => {
    close();
    router.push("/skincare");
  };

  // Render nothing until eligibility is decided (and nothing at all when
  // ineligible) — this is what prevents the 2.3MB video from being fetched
  // again on repeat homepage visits this session. Waiting for the effect
  // costs ~one tick, trivial against the 2.5s reveal delay.
  if (!POPUP_VIDEO_URL || eligible !== true) return null;

  return (
    // Mounted from the very start (not gated behind `open`), so the <video>
    // below starts downloading and buffering at page load — 2.5s+ of head
    // start before it needs to be shown. Visibility is purely opacity +
    // pointer-events, controlled by `open`, so the element (and its loaded/
    // buffered video) is never unmounted and remounted — that unmount/
    // remount is what was causing the stutter: previously the <video> didn't
    // exist in the DOM at all until the popup opened, so the browser only
    // started fetching it at the exact moment it needed to play — this way
    // it's already loaded and playing by the time it's revealed.
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={false}
      animate={{ opacity: open ? 1 : 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ pointerEvents: open ? "auto" : "none" }}
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <motion.div
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          scale: open ? 1 : 0.94,
          y: open ? 0 : 16,
        }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        // w-fit (not a fixed max-w-sm) — the card shrinks to exactly the
        // video's own rendered width instead of being a wider fixed box the
        // video sits inside of, which is what causes black bars down the
        // sides. max-w-[92vw] is only a safety cap so an unusually wide
        // video can't overflow the screen.
        className="relative w-fit max-w-[92vw] overflow-hidden rounded-2xl sm:rounded-3xl bg-[#9AC8DE] shadow-[0_32px_80px_rgba(0,0,0,0.45)] max-h-[90vh] flex flex-col"
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-90"
        >
          <svg
            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* No fixed aspect-ratio box on the video itself — it renders at its
            own natural proportions (maxWidth/maxHeight cap it, but
            width/height stay auto), and the CARD around it sizes to match
            (w-fit above) instead of the video sitting inside an
            independently-sized box. Result: video fully fills its own
            frame, no cropping, no empty bars. preload="auto" + onCanPlay
            drives videoReady, so it's confirmed buffered before reveal. */}
        <video
          src={POPUP_VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          className="block"
          style={{
            maxWidth: "100%",
            maxHeight: "70vh",
            width: "auto",
            height: "auto",
          }}
        />

        {/* Below the video, not overlaid on it — its own bar, brand blue
            (#9AC8DE), same width as the video/card, so the button never
            competes with the footage for attention. */}
        <div className="bg-[#9AC8DE] p-3.5 sm:p-4 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleShopNow}
            className="w-full rounded-full bg-white py-3 sm:py-3.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-gray-900 shadow-lg whitespace-nowrap transition-all duration-300 hover:bg-gray-100 active:scale-[0.97]"
          >
            Shop Now
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
