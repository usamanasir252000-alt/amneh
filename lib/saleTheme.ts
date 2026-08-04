// Azadi-sale visual theme window. While active, <html> carries SALE_THEME_CLASS
// and styles/globals.css recolors the primary buttons + announcement banner to
// the sale green (#01411C, Pakistan flag green). After the end date the class simply stops being
// applied — no redeploy needed, the site reverts to its normal colors on its
// own (server-side on the next ISR regeneration, client-side immediately via
// components/SaleTheme.tsx even on cached HTML).
//
// Ends at midnight PKT after 15 August 2026 — i.e. the green runs through the
// whole of the 15th, Pakistan time. Date.UTC keeps this independent of the
// server's local timezone: 15 Aug 19:00 UTC == 16 Aug 00:00 PKT (UTC+5).
export const SALE_THEME_END_MS = Date.UTC(2026, 7, 15, 19, 0, 0);

export const SALE_THEME_CLASS = "azadi-theme";

export function isSaleThemeActive(now: number = Date.now()): boolean {
  return now < SALE_THEME_END_MS;
}
