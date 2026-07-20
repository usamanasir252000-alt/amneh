import { useEffect, useRef, useState } from 'react';

// Drives every FadeUp/RevealText/ScaleIn reveal-on-scroll animation site-wide.
//
// FAIL-OPEN BY DEFAULT. `inView` starts TRUE, so the server-rendered HTML and
// the pre-hydration paint are always VISIBLE. This is the critical property:
// a Facebook/Instagram in-app browser that stalls or never finishes running JS
// (very common) can no longer leave content stuck at opacity:0 forever — the
// worst case is simply "no animation," never "invisible."
//
// (The old design did the opposite: content started at opacity:0 and was only
// revealed by `inView` flipping true from inside a useEffect. If hydration
// never ran, the effect never ran, and whole sections stayed blank — confirmed
// in production via a Clarity recording. A 2s fallback timer didn't help,
// because it too lived inside that same useEffect.)
//
// The animation is still applied without any visible flash: on mount we check
// if the element is BELOW the fold. If it is (off-screen), we hide it and let
// the IntersectionObserver reveal it as the user scrolls to it — the hide
// happens off-screen, so there's nothing to see flash. Above-the-fold content
// is left visible (it shouldn't animate-in anyway). If JS never runs, none of
// this happens and everything just stays visible.
export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Only arm the hide→reveal animation for elements currently below the fold.
    // Anything already on screen stays visible (no flash, no pointless anim).
    const rect = el.getBoundingClientRect();
    const belowFold = rect.top > window.innerHeight;
    if (!belowFold) return;

    setInView(false);
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);

    // Safety net in case the observer never reports (e.g. an interrupted
    // programmatic scroll leaves the element never crossing the threshold):
    // reveal anyway shortly after. Fast enough not to be noticed.
    const fallback = setTimeout(() => setInView(true), 800);

    return () => {
      obs.unobserve(el);
      clearTimeout(fallback);
    };
  }, [threshold]);

  return { ref, inView };
}
