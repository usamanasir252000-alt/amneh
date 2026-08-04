"use client";

import { useEffect } from "react";
import { isSaleThemeActive, SALE_THEME_CLASS, SALE_THEME_END_MS } from "@/lib/saleTheme";

// Client-side enforcement of the sale-theme window (see lib/saleTheme.ts).
// The server also stamps the class on <html> for a flash-free first paint,
// but that HTML can be served from the ISR cache for a while after the sale
// ends — this component corrects the class against the visitor's real clock
// on hydration, and if the deadline passes while the tab is open, flips the
// colors back at that exact moment.
export default function SaleTheme() {
  useEffect(() => {
    const apply = () =>
      document.documentElement.classList.toggle(SALE_THEME_CLASS, isSaleThemeActive());
    apply();

    const msLeft = SALE_THEME_END_MS - Date.now();
    if (msLeft <= 0) return;
    // setTimeout overflows past ~24.8 days; a tab never lives that long in
    // practice, but clamp anyway so the timer can't misfire instantly.
    const t = setTimeout(apply, Math.min(msLeft + 1000, 2 ** 31 - 1));
    return () => clearTimeout(t);
  }, []);

  return null;
}
