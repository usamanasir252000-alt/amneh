import { useEffect, useRef, useState } from 'react';

// Drives every FadeUp/RevealText/ScaleIn reveal-on-scroll animation site-wide.
// Content using this hook starts at opacity:0 and is only ever made visible
// by `inView` flipping true — so if the IntersectionObserver never fires for
// any reason (e.g. a programmatic auto-scroll elsewhere on the page gets
// interrupted by the user touching the screen mid-scroll, leaving the target
// element never fully crossing the viewport threshold), that content stays
// invisible FOREVER with no error, no crash, nothing — just a real customer
// looking at a blank page where products/headings should be. This happened
// in production (confirmed via a Clarity session recording + screenshot
// comparison: everything missing from the broken screen was exactly the
// stuff wrapped in this hook's animations, nothing else).
//
// The fix: a fallback timer forces `inView` true after 2s regardless of
// whether the observer ever reported an intersection. Fast/normal case is
// unaffected (the observer still fires almost immediately); worst case,
// content just becomes visible slightly late instead of never.
const FALLBACK_MS = 2000;

export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold }
    );
    obs.observe(el);

    const fallback = setTimeout(() => setInView(true), FALLBACK_MS);

    return () => {
      obs.unobserve(el);
      clearTimeout(fallback);
    };
  }, [threshold]);

  return { ref, inView };
}
