"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import BackButton from "@/components/BackButton";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  loyaltyPoints: number;
}

const TIERS = [
  { name: "Member", min: 0, color: "bg-gray-200 text-gray-700", icon: "⭐" },
  {
    name: "Silver",
    min: 500,
    color: "bg-slate-300 text-slate-800",
    icon: "🥈",
  },
  {
    name: "Gold",
    min: 1000,
    color: "bg-yellow-200 text-yellow-800",
    icon: "🥇",
  },
  {
    name: "Platinum",
    min: 2500,
    color: "bg-[#dff0f8] text-[#2b6c8a]",
    icon: "💎",
  },
];

function getTier(points: number) {
  return [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0];
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((u) => {
        if (!u || !u.id) {
          router.replace("/login");
        } else {
          setUser(u);
          setLoading(false);
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const points = user?.loyaltyPoints ?? 0;
  const tier = getTier(points);

  return (
    <main className="bg-[#f1efef] min-h-screen">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 pt-28 pb-12 lg:px-10">
        <div className="mb-6">
          <BackButton />
        </div>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : user ? (
          <div className="space-y-5">
            {/* Header card */}
            <div className="bg-gray-900 rounded-2xl p-8 text-white flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-[#4d9ab5]/30 flex items-center justify-center text-2xl font-bold text-[#9ac9df] flex-shrink-0">
                {user.firstName.charAt(0).toUpperCase()}
                {user.lastName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-white/50 text-sm mt-0.5">{user.email}</p>
                {tier && (
                  <span
                    className={`inline-block mt-2 text-[11px] px-2.5 py-0.5 rounded-full font-medium ${tier.color}`}
                  >
                    {tier.icon} {tier.name} Member
                  </span>
                )}
              </div>
            </div>

            {/* Details card */}
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
              <div className="px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-0.5">
                    First Name
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    {user.firstName}
                  </p>
                </div>
              </div>
              <div className="px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-0.5">
                    Last Name
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    {user.lastName || "—"}
                  </p>
                </div>
              </div>
              <div className="px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-0.5">
                    Email
                  </p>
                  <p className="text-sm font-medium text-gray-800">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-0.5">
                    Loyalty Points
                  </p>
                  <p className="text-sm font-medium text-[#4d9ab5]">
                    {points.toLocaleString()} pts
                  </p>
                </div>
                <Link
                  href="/rewards"
                  className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-700 transition"
                >
                  View rewards →
                </Link>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
              <Link
                href="/rewards"
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
              >
                <span className="text-sm text-gray-700">My Rewards</span>
                <svg
                  className="h-4 w-4 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
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
        ) : null}
      </div>

      <div style={{ background: "#f1efef", height: "56px" }} />
      <Footer />
    </main>
  );
}
