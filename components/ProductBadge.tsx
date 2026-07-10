// Cute pastel outline pill for product cards — pill border + fill share a
// hue, small emoji, playful label. `badge` comes from Shopify tags (see
// lib/shopify.ts normalizeProduct): a real merchandiser-set signal tag if
// present, else a deterministic pick from a small pool of cute fallback
// labels — so untagged products get varied badges instead of all repeating
// the same category tag. Exactly four badge types are supported, each with
// its own distinct color so cards don't all look the same. Spelling/wording
// variants of the same tag (e.g. "best seller" vs "best selling") share one
// visual style rather than becoming separate badge types.
const NEW = { label: "New", emoji: "🌱", classes: "bg-emerald-50 border-emerald-300 text-emerald-700" };
const BEST_SELLING = { label: "Best Selling", emoji: "🏆", classes: "bg-cyan-50 border-cyan-300 text-cyan-700" };
const CUSTOMER_FAVOURITE = { label: "Customer Favourite", emoji: "💖", classes: "bg-fuchsia-50 border-fuchsia-300 text-fuchsia-700" };
const MOST_LOVED = { label: "Most Loved", emoji: "💕", classes: "bg-pink-50 border-pink-300 text-pink-600" };

const PRESETS: Record<string, { label: string; emoji: string; classes: string }> = {
  "new": NEW,
  "best selling": BEST_SELLING,
  "best seller": BEST_SELLING,
  "bestseller": BEST_SELLING,
  "customer favorite": CUSTOMER_FAVOURITE,
  "customer favourite": CUSTOMER_FAVOURITE,
  "most loved": MOST_LOVED,
};

// Safety net only — lib/shopify.ts should never produce a value outside the
// four presets above, but this keeps any unexpected tag from rendering
// unstyled instead of breaking the layout.
const DEFAULT_PRESET = { emoji: "💧", classes: "bg-[#faf0f3] border-[#e6cdd6] text-[#5f3d4e]" };

function titleCase(text: string) {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProductBadge({ badge, className = "" }: { badge: string; className?: string }) {
  if (!badge) return null;
  const preset = PRESETS[badge.toLowerCase().trim()];
  const label = preset?.label ?? titleCase(badge);
  const emoji = preset?.emoji ?? DEFAULT_PRESET.emoji;
  const classes = preset?.classes ?? DEFAULT_PRESET.classes;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm whitespace-nowrap ${classes} ${className}`}
    >
      {label}
      <span className="text-xs leading-none" aria-hidden>{emoji}</span>
    </span>
  );
}
