// ─── Amneh Rewards — shared loyalty config ─────────────────────────────────────
// Imported by both the server (orders webhook, loyalty API) and the rewards page,
// so the rules live in exactly one place.

/** Points granted for each qualifying paid order. */
export const POINTS_PER_ORDER = 100;

/** Orders below this value (PKR, by product subtotal) earn no points. */
export const MIN_ORDER_VALUE = 1500;

/** One-time bonus granted when a new account is activated. */
export const WELCOME_BONUS = 100;

export interface Reward {
  points: number;
  discountPct: number;
  label: string;
}

/** Discount tiers, unlocked once the customer's point balance reaches them. */
export const REWARDS: Reward[] = [
  { points: 500, discountPct: 5, label: "5% off your next order" },
  { points: 1000, discountPct: 10, label: "10% off your next order" },
  { points: 1500, discountPct: 15, label: "15% off your next order" },
  { points: 2500, discountPct: 20, label: "20% off your next order" },
];

export interface Tier {
  name: string;
  min: number;
}

export const TIERS: Tier[] = [
  { name: "Member", min: 0 },
  { name: "Silver", min: 500 },
  { name: "Gold", min: 1000 },
  { name: "Platinum", min: 2500 },
];

export function getTier(points: number): Tier {
  return [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0];
}

export function getNextTier(points: number): Tier | null {
  return TIERS.find((t) => t.min > points) ?? null;
}
