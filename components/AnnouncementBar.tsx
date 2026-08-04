"use client";

import { useEffect, useRef, useState } from "react";

// Slim marquee strip pinned to the very top of every page (above the fixed
// navbar, which is why the navbar starts at top-9 and page content offsets
// account for this 36px bar).
const MESSAGES = [
  "AZADI SALE 🇵🇰- 14% OFF ON ALL PRODUCTS",
  "FREE SHIPPING ON ORDERS Above PKR 2,500",
  "AZADI SALE 🇵🇰- 14% OFF ON ALL PRODUCTS",
  "LIMITED TIME ONLY",
];

// Constant scroll speed regardless of screen width or how much text is in
// MESSAGES — the number of rendered copies (below) adapts instead, so the
// speed never has to change to compensate.
const PIXELS_PER_SECOND = 45;

function MessageSet() {
  return (
    <div className="flex shrink-0 items-center">
      {MESSAGES.map((msg, i) => (
        <span key={i} className="flex items-center">
          <span className="px-8 text-[11px] font-bold uppercase tracking-[0.22em]">
            {msg}
          </span>
          <span aria-hidden className="text-white/40">
            &bull;
          </span>
        </span>
      ))}
    </div>
  );
}

// z-[70] — above every overlay in the app (cart drawer z-40/z-50, auth modal
// z-50/z-[60]) so the marquee stays fully visible and running instead of
// getting dimmed/covered whenever one of them opens.
export default function AnnouncementBar() {
  const measureRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [copies, setCopies] = useState(2);

  // Renders as many identical copies of MESSAGES as needed to guarantee the
  // strip stays gap-free at any screen width. A fixed "2 copies + shift by
  // 50%" only stays seamless if a single copy is already wider than the
  // viewport — with a short message set that's false on most screens, so
  // after both copies scrolled past there was a stretch of empty bar before
  // the loop restarted. Measuring the real width and computing how many
  // copies are needed (re-measured on resize) fixes that at the source.
  useEffect(() => {
    const measure = () => {
      const w = measureRef.current?.getBoundingClientRect().width;
      if (!w) return;
      setTrackWidth(w);
      setCopies(Math.max(2, Math.ceil(window.innerWidth / w) + 1));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const duration = trackWidth > 0 ? trackWidth / PIXELS_PER_SECOND : undefined;

  return (
    <div className="fixed inset-x-0 top-0 z-[70] flex h-9 items-center overflow-hidden bg-[#5f3d4e] text-white">
      {/* Hidden measuring copy — off-screen, never visible, used only to
          read one message set's natural rendered width. */}
      <div ref={measureRef} className="absolute opacity-0 pointer-events-none flex shrink-0 items-center" aria-hidden="true">
        <MessageSet />
      </div>

      <div
        className="animate-marquee-dynamic flex whitespace-nowrap will-change-transform"
        style={
          duration
            ? ({ animationDuration: `${duration}s`, "--marquee-shift": `-${trackWidth}px` } as React.CSSProperties)
            : { animationPlayState: "paused" }
        }
      >
        {Array.from({ length: copies }, (_, i) => (
          <MessageSet key={i} />
        ))}
      </div>
    </div>
  );
}
