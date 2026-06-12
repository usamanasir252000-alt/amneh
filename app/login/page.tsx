"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthPageShell from "@/components/AuthPageShell";
import BackButton from "@/components/BackButton";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      console.log("Attempting login with", { email });
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        router.push("/");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell>
      <div className="mb-4">
        <BackButton light />
      </div>
      <div className="rounded-3xl bg-white/20 p-8 shadow-[0_24px_80px_rgba(63,22,34,0.12)] ring-1 ring-white/40 backdrop-blur-xl sm:p-10">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#9f7c89]">
            welcome back
          </p>
          <h1 className="mt-6 text-3xl font-bold uppercase tracking-[0.16em] text-[#8c5e6c] sm:text-4xl">
            login
          </h1>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              required
              className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              required
              className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <p className="text-xs leading-6 text-gray-500">
            by logging in, you agree to our terms, privacy policy, and rewards
            program terms.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl border border-[#8c5e6c] bg-[#f8e8ed] px-5 py-3 text-sm uppercase tracking-[0.2em] text-[#5f3d4e] transition hover:bg-[#e9d1d8] hover:text-[#6a4353] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "logging in…" : "log in"}
          </button>

          <div className="mt-6">
            <GoogleSignInButton />
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            don&apos;t have an account yet?{" "}
            <Link
              href="/signup"
              className="font-semibold text-[#5f3d4e] underline hover:text-[#8c5e6c]"
            >
              create account
            </Link>
          </div>
        </form>
      </div>
    </AuthPageShell>
  );
}
