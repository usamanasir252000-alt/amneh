"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthPageShell from "@/components/AuthPageShell";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToEmails, setAgreeToEmails] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
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
      <div className="rounded-3xl bg-white/20 p-8 shadow-[0_24px_80px_rgba(63,22,34,0.12)] ring-1 ring-white/40 backdrop-blur-xl sm:p-10">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#9f7c89]">
            new here?
          </p>
          <h1 className="mt-6 text-3xl font-bold uppercase tracking-[0.16em] text-[#8c5e6c] sm:text-4xl">
            create an account
          </h1>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                first name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="first name"
                required
                className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                last name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="last name"
                className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
              />
            </div>
          </div>

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
            <p className="mt-1 text-xs text-gray-500">
              must be at least 6 characters long
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              re-enter password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="re-enter password"
              required
              className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={agreeToEmails}
                onChange={(e) => setAgreeToEmails(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-[#8c5e6c] focus:ring-[#8c5e6c]"
              />
              <span>
                i would like to receive emails with updates on products, offers, and promotions from amneh.
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
                className="mt-1 h-4 w-4 rounded border-gray-300 text-[#8c5e6c] focus:ring-[#8c5e6c]"
              />
              <span>
                i agree to amneh&apos;s terms, privacy policy, and rewards program terms
              </span>
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl border border-[#8c5e6c] bg-[#f8e8ed] px-5 py-3 text-sm uppercase tracking-[0.2em] text-[#5f3d4e] transition hover:bg-[#e9d1d8] hover:text-[#6a4353] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "creating account…" : "create account"}
          </button>

          <div className="text-center text-sm text-gray-600">
            already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#5f3d4e] underline hover:text-[#8c5e6c]"
            >
              log in
            </Link>
          </div>
        </form>
      </div>
    </AuthPageShell>
  );
}
