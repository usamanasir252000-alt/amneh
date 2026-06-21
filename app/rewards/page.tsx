"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import {
  TIERS,
  getTier,
  getNextTier,
  POINTS_PER_ORDER,
  MIN_ORDER_VALUE,
  WELCOME_BONUS,
} from "@/lib/loyalty";

interface NavUser {
  id: string;
  email: string;
  firstName: string;
}

interface RewardRow {
  points: number;
  discountPct: number;
  label: string;
  unlocked: boolean;
  code: string | null;
  expiresAt: string | null;
}

interface Loyalty {
  points: number;
  rewards: RewardRow[];
}

const TIER_UI: Record<string, { color: string; icon: string }> = {
  Member: { color: "bg-gray-200 text-gray-700", icon: "⭐" },
  Silver: { color: "bg-slate-300 text-slate-800", icon: "🥈" },
  Gold: { color: "bg-yellow-200 text-yellow-800", icon: "🥇" },
  Platinum: { color: "bg-[#dff0f8] text-[#2b6c8a]", icon: "💎" },
};

export default function RewardsPage() {
  const [user, setUser] = useState<NavUser | null>(null);
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/loyalty", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([u, l]) => {
        setUser(u || null);
        setLoyalty(l || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
    setUser(null);
    window.location.assign("/");
  };

  const points = loyalty?.points ?? 0;
  const tier = getTier(points);
  const nextTier = getNextTier(points);
  const progressPct = nextTier
    ? Math.min(100, ((points - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;
  const tierUi = TIER_UI[tier.name] ?? TIER_UI.Member;

  return (
    <main className="bg-[#f1efef] min-h-screen">
      <Navbar />

      {/* Header */}
      <div className="relative overflow-hidden bg-gray-900 pt-32 pb-16 text-center px-6">
        <div className="absolute top-24 left-6 z-[60]">
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
            Earn points on every order. Reach a milestone and we&apos;ll send
            you an exclusive discount code for your next purchase.
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
              Create an account to start earning. Get{" "}
              <strong>{WELCOME_BONUS} welcome points</strong> when you join, then{" "}
              <strong>{POINTS_PER_ORDER} points</strong> for every order you
              place.
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
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${tierUi.color}`}
                  >
                    {tierUi.icon} {tier.name}
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
                    {tierUi.icon} {tier.name}
                  </span>
                  <span className="text-gray-400">
                    {(TIER_UI[nextTier.name] ?? TIER_UI.Member).icon}{" "}
                    {nextTier.name} at {nextTier.min.toLocaleString()} pts
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-[#4d9ab5] transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {(nextTier.min - points).toLocaleString()} points to{" "}
                  {nextTier.name}
                </p>
              </div>
            )}

            {/* How it works — rules spelled out */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-5">
                How It Works
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
                      {WELCOME_BONUS} points when you create your account
                    </p>
                  </div>
                  <span className="ml-auto text-sm font-semibold text-[#4d9ab5]">
                    +{WELCOME_BONUS} pts
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#dff0f8] flex items-center justify-center text-lg flex-shrink-0">
                    🛍️
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Earn On Every Order
                    </p>
                    <p className="text-xs text-gray-400">
                      {POINTS_PER_ORDER} points per order over PKR{" "}
                      {MIN_ORDER_VALUE.toLocaleString()}
                    </p>
                  </div>
                  <span className="ml-auto text-sm font-semibold text-[#4d9ab5]">
                    +{POINTS_PER_ORDER} pts
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 leading-6">
                  When your points reach a reward milestone, we automatically
                  generate a personal discount code for your next order. Each
                  code is single-use, tied to your account, and valid for 30
                  days. Points keep adding up — reaching a reward doesn&apos;t
                  reset your balance. Orders under PKR{" "}
                  {MIN_ORDER_VALUE.toLocaleString()}, cancelled orders, and
                  refunds don&apos;t earn points.
                </p>
              </div>
            </div>

            {/* Rewards / unlocked codes */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-5">
                Rewards
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(loyalty?.rewards ?? []).map((r) => (
                  <div
                    key={r.points}
                    className={`rounded-xl border p-5 ${
                      r.unlocked
                        ? "border-[#4d9ab5] bg-[#f1efef]"
                        : "border-gray-100 bg-gray-50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                          {r.points.toLocaleString()} pts
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {r.label}
                        </p>
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          r.unlocked ? "text-[#4d9ab5]" : "text-gray-300"
                        }`}
                      >
                        {r.discountPct}%
                      </div>
                    </div>

                    {r.unlocked && r.code ? (
                      <div className="mt-4 rounded-lg bg-white border border-dashed border-[#4d9ab5] px-3 py-2.5 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400">
                          Your code
                        </p>
                        <p className="text-base font-bold tracking-widest text-gray-900">
                          {r.code}
                        </p>
                        {r.expiresAt && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Expires{" "}
                            {new Date(r.expiresAt).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    ) : r.unlocked ? (
                      <p className="mt-4 text-xs text-gray-400">
                        Your code will appear here shortly after your qualifying
                        order.
                      </p>
                    ) : (
                      <p className="mt-4 text-xs text-gray-400">
                        {(r.points - points).toLocaleString()} more points to
                        unlock
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Apply your code at checkout. Codes can&apos;t be combined with
                other discounts.
              </p>
            </div>

            {/* Tiers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-5">
                Membership Tiers
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TIERS.map((t) => {
                  const ui = TIER_UI[t.name] ?? TIER_UI.Member;
                  return (
                    <div
                      key={t.name}
                      className={`rounded-xl p-4 text-center ${
                        t.min <= points ? ui.color : "bg-gray-50 text-gray-300"
                      }`}
                    >
                      <div className="text-2xl mb-2">{ui.icon}</div>
                      <p className="text-xs font-semibold uppercase tracking-wide">
                        {t.name}
                      </p>
                      <p className="text-[11px] mt-1 opacity-70">
                        {t.min === 0 ? "0+" : `${t.min.toLocaleString()}+`} pts
                      </p>
                    </div>
                  );
                })}
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
