"use client";

import Link from "next/link";
import { useState } from "react";
import AuthPageShell from "@/components/AuthPageShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <AuthPageShell>
      <div className="rounded-3xl bg-white/95 p-8 shadow-[0_24px_80px_rgba(63,22,34,0.12)] ring-1 ring-gray-200 sm:p-10">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[#9f7c89]">
            welcome back
          </p>
          <h1 className="mt-6 text-4xl font-bold uppercase tracking-[0.18em] text-[#8c5e6c] sm:text-5xl">
            LOGIN
          </h1>
        </div>

        <form className="mt-10 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
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
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-gray-500">&nbsp;</span>
            <a
              href="#"
              className="text-sm font-medium text-[#5f3d4e] hover:text-[#8c5e6c] underline"
            >
              forgot password?
            </a>
          </div>

          <p className="text-xs leading-6 text-gray-500">
            by logging in, you agree to our{" "}
            <a href="#" className="underline text-gray-600 hover:text-gray-800">
              terms
            </a>
            ,{" "}
            <a href="#" className="underline text-gray-600 hover:text-gray-800">
              privacy policy
            </a>
            , and{" "}
            <a href="#" className="underline text-gray-600 hover:text-gray-800">
              rewards program terms
            </a>
            .
          </p>

          <button
            type="submit"
            className="w-full rounded-2xl border border-[#8c5e6c] bg-[#f8e8ed] px-5 py-3 text-sm uppercase tracking-[0.2em] text-[#5f3d4e] transition hover:bg-[#e9d1d8] hover:text-[#6a4353]"
          >
            log in
          </button>

          <div className="text-center text-sm text-gray-600">
            don't have an account yet?{" "}
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
