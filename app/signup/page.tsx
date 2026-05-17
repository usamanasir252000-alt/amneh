"use client";

import Link from "next/link";
import { useState } from "react";
import AuthPageShell from "@/components/AuthPageShell";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToEmails, setAgreeToEmails] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  return (
    <AuthPageShell>
      <div className="rounded-3xl bg-white/95 p-8 shadow-[0_24px_80px_rgba(63,22,34,0.12)] ring-1 ring-gray-200 sm:p-10">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[#9f7c89]">
            new here?
          </p>
          <h1 className="mt-6 text-4xl font-bold uppercase tracking-[0.18em] text-[#8c5e6c] sm:text-5xl">
            CREATE AN ACCOUNT
          </h1>
        </div>

        <form className="mt-10 space-y-6">
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
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
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
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
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
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              must be at least 6 characters long
            </p>
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
                i would like to receive emails with updates on products, offers,
                promotions, and other marketing information from kylie jenner
                brands. i understand that i can opt out of these communications,
                free of charge, at any time by sending an email to:{" "}
                <a
                  href="mailto:customerservice@kyliecosmetics.com"
                  className="underline text-gray-600 hover:text-gray-800"
                >
                  customerservice@kyliecosmetics.com
                </a>{" "}
                with the subject line “unsubscribe”
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-[#8c5e6c] focus:ring-[#8c5e6c]"
              />
              <span>
                please agree to our{" "}
                <a
                  href="#"
                  className="underline text-gray-600 hover:text-gray-800"
                >
                  terms
                </a>
                ,{" "}
                <a
                  href="#"
                  className="underline text-gray-600 hover:text-gray-800"
                >
                  privacy policy
                </a>
                , and{" "}
                <a
                  href="#"
                  className="underline text-gray-600 hover:text-gray-800"
                >
                  rewards program terms
                </a>{" "}
                to create an account
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl border border-[#8c5e6c] bg-[#f8e8ed] px-5 py-3 text-sm uppercase tracking-[0.2em] text-[#5f3d4e] transition hover:bg-[#e9d1d8] hover:text-[#6a4353]"
          >
            create account
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
