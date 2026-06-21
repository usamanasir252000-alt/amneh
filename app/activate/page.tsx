"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthPageShell from "@/components/AuthPageShell";

type Status = "form" | "submitting" | "done";

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activationUrl = searchParams.get("url") ?? "";

  const [status, setStatus] = useState<Status>("form");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(5);

  // Countdown + redirect to login once activated.
  useEffect(() => {
    if (status !== "done") return;
    if (countdown <= 0) {
      router.push("/login");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!activationUrl) {
      setError("Missing activation link. Please use the link from your email.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activationUrl, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("done");
      } else {
        setError(data.error || "Something went wrong");
        setStatus("form");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("form");
    }
  };

  // ── Submitting spinner ──────────────────────────────────────────────────────
  if (status === "submitting") {
    return (
      <div className="rounded-3xl bg-white/20 p-8 text-center shadow-[0_24px_80px_rgba(63,22,34,0.12)] ring-1 ring-white/40 backdrop-blur-xl sm:p-10">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#e9d1d8] border-t-[#8c5e6c]" />
        <p className="text-sm text-gray-500">Activating your account…</p>
      </div>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (status === "done") {
    return (
      <div className="rounded-3xl bg-white/20 p-8 text-center shadow-[0_24px_80px_rgba(63,22,34,0.12)] ring-1 ring-white/40 backdrop-blur-xl sm:p-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f4fa]">
          <svg className="h-7 w-7 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-[#8c5e6c]">
          Your email has been verified
        </h1>
        <p className="text-sm text-gray-500">
          Automatically redirecting to the login page in {countdown} second
          {countdown === 1 ? "" : "s"}, or{" "}
          <Link href="/login" className="font-semibold text-[#5f3d4e] underline hover:text-[#8c5e6c]">
            click here
          </Link>
          .
        </p>
      </div>
    );
  }

  // ── Fallback: ask for a password (different device / no stored password) ────
  return (
    <div className="rounded-3xl bg-white/20 p-8 shadow-[0_24px_80px_rgba(63,22,34,0.12)] ring-1 ring-white/40 backdrop-blur-xl sm:p-10">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-[#9f7c89]">almost there</p>
        <h1 className="mt-6 text-3xl font-bold uppercase tracking-[0.16em] text-[#8c5e6c] sm:text-4xl">
          activate your account
        </h1>
        <p className="mt-4 text-sm text-gray-500">
          Set a password to verify your email and activate your account.
        </p>
      </div>

      <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            required
            className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">must be at least 6 characters long</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">re-enter password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="re-enter password"
            required
            className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
          />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-2xl border border-[#8c5e6c] bg-[#f8e8ed] px-5 py-3 text-sm uppercase tracking-[0.2em] text-[#5f3d4e] transition hover:bg-[#e9d1d8] hover:text-[#6a4353] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "activating…" : "activate account"}
        </button>

        <div className="mt-6 text-center text-sm text-gray-600">
          already activated?{" "}
          <Link href="/login" className="font-semibold text-[#5f3d4e] underline hover:text-[#8c5e6c]">
            log in
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <AuthPageShell>
      <Suspense fallback={null}>
        <ActivateForm />
      </Suspense>
    </AuthPageShell>
  );
}
