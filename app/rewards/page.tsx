"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  loyaltyPoints: number;
}

const TIERS = [
  {
    name: "Member",
    min: 0,
    max: 499,
    color: "bg-gray-200 text-gray-700",
    icon: "⭐",
  },
  {
    name: "Silver",
    min: 500,
    max: 999,
    color: "bg-slate-300 text-slate-800",
    icon: "🥈",
  },
  {
    name: "Gold",
    min: 1000,
    max: 2499,
    color: "bg-yellow-200 text-yellow-800",
    icon: "🥇",
  },
  {
    name: "Platinum",
    min: 2500,
    max: Infinity,
    color: "bg-[#dff0f8] text-[#2b6c8a]",
    icon: "💎",
  },
];

const REWARDS = [
  { points: 500, label: "5% off your next order", discount: "5%" },
  { points: 1000, label: "10% off your next order", discount: "10%" },
  { points: 2000, label: "15% off your next order", discount: "15%" },
  { points: 3000, label: "20% off your next order", discount: "20%" },
];

function getTier(points: number) {
  return [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0];
}

function getNextTier(points: number) {
  return TIERS.find((t) => t.min > points) ?? null;
}

export default function RewardsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((u) => {
        setUser(u);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  };

  const points = user?.loyaltyPoints ?? 0;
  const tier = getTier(points);
  const nextTier = getNextTier(points);
  const progressPct = nextTier
    ? Math.min(100, ((points - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;

  return (
    <main className="bg-[#f1efef] min-h-screen">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden bg-gray-900 pt-32 pb-16 text-center px-6">
        <div className="absolute top-20 left-6 z-20">
          <BackButton light />
        </div>
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.4em] text-[#9ac9df] mb-3">
            loyalty program
          </p>
          <h1 className="text-5xl font-bold uppercase tracking-tight text-white">
            Amneh Rewards
          </h1>
          <p className="mt-4 text-white/60 text-sm max-w-md mx-auto leading-7">
            Earn points every time you log in. Redeem for exclusive discounts on
            your favourite products.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 lg:px-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : !user ? (
          /* Not logged in */
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <div className="text-5xl mb-6">✨</div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900 mb-3">
              Join Amneh Rewards
            </h2>
            <p className="text-gray-500 text-sm leading-7 max-w-sm mx-auto mb-8">
              Create an account or log in to start earning points. Get{" "}
              <strong>100 welcome points</strong> just for signing up, and{" "}
              <strong>25 points</strong> every time you log in.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/signup"
                className="bg-gray-900 text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-gray-700 transition"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="border border-gray-900 px-8 py-3 text-xs uppercase tracking-widest text-gray-900 hover:bg-gray-900 hover:text-white transition"
              >
                Log In
              </Link>
            </div>
          </div>
        ) : (
          /* Logged in */
          <div className="space-y-6">
            {/* Points card */}
            <div className="bg-gray-900 rounded-2xl p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/50 mb-1">
                  Welcome back
                </p>
                <h2 className="text-2xl font-bold">{user.firstName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${tier.color}`}
                  >
                    {tier.icon} {tier.name}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-white/50 mb-1">
                  Your Points
                </p>
                <p className="text-5xl font-bold text-[#9ac9df]">
                  {points.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress to next tier */}
            {nextTier && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-medium text-gray-700">
                    {tier.icon} {tier.name}
                  </span>
                  <span className="text-gray-400">
                    {nextTier.icon} {nextTier.name} at{" "}
                    {nextTier.min.toLocaleString()} pts
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-[#4d9ab5] transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {(nextTier.min - user.loyaltyPoints).toLocaleString()} points
                  to {nextTier.name}
                </p>
              </div>
            )}

            {/* How to earn */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-5">
                How to Earn
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#dff0f8] flex items-center justify-center text-lg flex-shrink-0">
                    🎉
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Welcome Bonus
                    </p>
                    <p className="text-xs text-gray-400">
                      100 points when you create your account
                    </p>
                  </div>
                  <span className="ml-auto text-sm font-semibold text-[#4d9ab5]">
                    +100 pts
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#dff0f8] flex items-center justify-center text-lg flex-shrink-0">
                    📅
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Daily Login
                    </p>
                    <p className="text-xs text-gray-400">
                      25 points each day you log in (once per day)
                    </p>
                  </div>
                  <span className="ml-auto text-sm font-semibold text-[#4d9ab5]">
                    +25 pts
                  </span>
                </div>
                <div className="flex items-center gap-4 opacity-50">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                    🛍️
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Purchase Rewards
                    </p>
                    <p className="text-xs text-gray-400">
                      Coming soon — earn points on every order
                    </p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400 uppercase tracking-wide">
                    Soon
                  </span>
                </div>
              </div>
            </div>

            {/* Redeem rewards */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-5">
                Redeem Rewards
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {REWARDS.map((r) => {
                  const unlocked = user.loyaltyPoints >= r.points;
                  return (
                    <div
                      key={r.points}
                      className={`rounded-xl border p-5 flex items-center justify-between gap-4 ${unlocked ? "border-[#4d9ab5] bg-[#f1efef]" : "border-gray-100 bg-gray-50 opacity-60"}`}
                    >
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                          {r.points.toLocaleString()} pts
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {r.label}
                        </p>
                      </div>
                      <div
                        className={`text-2xl font-bold ${unlocked ? "text-[#4d9ab5]" : "text-gray-300"}`}
                      >
                        {r.discount}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Purchase rewards redemption coming soon via Shopify integration.
              </p>
            </div>

            {/* Tiers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-5">
                Membership Tiers
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TIERS.map((t) => (
                  <div
                    key={t.name}
                    className={`rounded-xl p-4 text-center ${t.min <= user.loyaltyPoints ? t.color : "bg-gray-50 text-gray-300"}`}
                  >
                    <div className="text-2xl mb-2">{t.icon}</div>
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      {t.name}
                    </p>
                    <p className="text-[11px] mt-1 opacity-70">
                      {t.min === 0 ? "0+" : `${t.min.toLocaleString()}+`} pts
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-gray-700 uppercase tracking-widest transition"
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: "#f1efef", height: "56px" }} />
      <Footer />
    </main>
  );
}
