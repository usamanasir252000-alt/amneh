// Trust signals: satisfaction guarantee and ingredient guarantee — shown on PDP, cart, and checkout.
export function TrustBadges() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
        <span className="text-2xl">✓</span>
        <div>
          <p className="text-xs font-semibold text-emerald-900">Satisfaction Guaranteed</p>
          <p className="text-xs text-emerald-700">If not, We'll make it right!</p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-center">
        <span className="text-2xl">🌿</span>
        <div>
          <p className="text-xs font-semibold text-green-900">Clean Ingredients</p>
          <p className="text-xs text-green-700">Clinically proven actives</p>
        </div>
      </div>
    </div>
  );
}

export default TrustBadges;
