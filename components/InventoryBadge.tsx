// Displays inventory urgency messaging — always shows urgency to encourage buying
// intent, even when stock is abundant.
export function InventoryBadge({ inventory }: { inventory: number }) {
  if (inventory < 0) return null; // Untracked inventory

  // Pick messaging based on inventory level; lower thresholds get stronger urgency.
  let message = "Trending now";
  let icon = "🔥";

  if (inventory <= 2) {
    message = "Almost gone!";
    icon = "⚡";
  } else if (inventory <= 5) {
    message = "Only a few left";
    icon = "⚠️";
  } else if (inventory <= 15) {
    message = "Limited stock";
    icon = "📦";
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  );
}
