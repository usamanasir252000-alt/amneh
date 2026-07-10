"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Shopify doesn't expose a "site-wide settings" field for something like
// this — upload the video in Admin → Content → Files, open it, copy its
// cdn.shopify.com URL, and paste it here.
const POPUP_VIDEO_URL = "https://cdn.shopify.com/videos/c/o/v/a72890341da645e7b84420b882b43beb.mp4";

const SHOW_DELAY_MS = 2500;

export default function WelcomePopup() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Fires every time the homepage is visited/reloaded — no once-per-session
  // gate, by design.
  useEffect(() => {
    if (!POPUP_VIDEO_URL) return;
    const t = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const close = () => setOpen(false);

  const handleShopNow = () => {
    close();
    router.push("/skincare");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            // w-fit (not a fixed max-w-sm) — the card shrinks to exactly the
            // video's own rendered width instead of being a wider fixed box
            // the video sits inside of, which is what causes black bars down
            // the sides. max-w-[92vw] is only a safety cap so an unusually
            // wide video can't overflow the screen.
            className="relative w-fit max-w-[92vw] overflow-hidden rounded-2xl sm:rounded-3xl bg-[#9AC8DE] shadow-[0_32px_80px_rgba(0,0,0,0.45)] max-h-[90vh] flex flex-col"
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-90"
            >
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* No fixed aspect-ratio box on the video itself — it renders at
                its own natural proportions (maxWidth/maxHeight cap it, but
                width/height stay auto), and the CARD around it sizes to
                match (w-fit above) instead of the video sitting inside an
                independently-sized box. Result: video fully fills its own
                frame, no cropping, no empty bars. */}
            <video
              src={POPUP_VIDEO_URL}
              autoPlay
              loop
              muted
              playsInline
              className="block"
              style={{ maxWidth: "100%", maxHeight: "70vh", width: "auto", height: "auto" }}
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
      )}
    </AnimatePresence>
  );
}
