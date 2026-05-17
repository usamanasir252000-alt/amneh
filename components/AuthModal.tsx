"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type AuthModalMode = "signIn" | "signUp";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: AuthModalMode;
}

export default function AuthModal({
  open,
  onClose,
  initialMode = "signIn",
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Separate state for newsletter to prevent state pollution
  const [newsletterEmail, setNewsletterEmail] = useState("");

  useEffect(() => {
    if (open) {
      setMode(initialMode);
    }
  }, [open, initialMode]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle authentication logic here
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="relative w-full max-w-xl rounded-[2rem] bg-white/95 pt-2 pb-2 pl-6 pr-6 shadow-2xl ring-1 ring-gray-200 backdrop-blur-xl transition-all sm:p-8 lg:max-w-4xl lg:p-6"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close auth modal"
              className="absolute right-4 top-4 z-10 rounded-full border border-gray-200 bg-white/90 p-2 text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Responsive grid wrapper for Desktop viewport optimizations */}
            <div className="grid gap-8 items-center lg:grid-cols-12">
              {/* Left Column (or Top section on mobile): Main Branding & Interaction Form */}
              <div className="lg:col-span-7 mx-auto w-full max-w-md">
                <div className="flex justify-center">
                  <Image
                    src="/logo.svg"
                    alt="amneh logo"
                    width={90}
                    height={90}
                    priority
                  />
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs uppercase tracking-[0.35em] text-[#9f7c89]">
                    {mode === "signIn" ? "welcome back" : "new here?"}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold uppercase tracking-[0.16em] text-[#8c5e6c] sm:text-sm">
                    {mode === "signIn" ? "sign in" : "create an account"}
                  </h2>
                </div>

                <form className="mt-2 space-y-3" onSubmit={handleSubmit}>
                  {mode === "signUp" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-gray-600">
                          first name
                        </span>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(event) => setFirstName(event.target.value)}
                          placeholder="first name"
                          className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-gray-600">
                          last name
                        </span>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(event) => setLastName(event.target.value)}
                          placeholder="last name"
                          className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
                        />
                      </label>
                    </div>
                  )}

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">
                      email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="email"
                      className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">
                      password
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="password"
                      className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
                    />
                  </label>

                  {mode === "signUp" && (
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-gray-600">
                        re-enter password
                      </span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        placeholder="re-enter password"
                        className="w-full rounded-xl border border-gray-300 bg-white/80 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100"
                      />
                    </label>
                  )}

                  {mode === "signUp" ? (
                    <label className="flex items-start gap-3 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(event) =>
                          setAgreeTerms(event.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#8c5e6c] focus:ring-[#8c5e6c]"
                      />
                      <span>
                        i agree to the{" "}
                        <a
                          href="#"
                          className="underline text-gray-600 hover:text-gray-800"
                        >
                          terms
                        </a>{" "}
                        and{" "}
                        <a
                          href="#"
                          className="underline text-gray-600 hover:text-gray-800"
                        >
                          privacy policy
                        </a>
                        .
                      </span>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>&nbsp;</span>
                      <a
                        href="#"
                        className="text-[#5f3d4e] hover:text-[#8c5e6c] underline"
                      >
                        forgot password?
                      </a>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-2xl border border-[#8c5e6c] bg-[#f8e8ed] px-5 py-3 text-sm uppercase tracking-[0.2em] text-[#5f3d4e] transition hover:bg-[#e9d1d8] hover:text-[#6a4353]"
                  >
                    {mode === "signIn" ? "sign in" : "create account"}
                  </button>

                  <div className="text-center text-xs text-gray-600">
                    {mode === "signIn" ? (
                      <>
                        dont have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setMode("signUp")}
                          className="font-semibold text-[#5f3d4e] underline hover:text-[#8c5e6c]"
                        >
                          sign up
                        </button>
                      </>
                    ) : (
                      <>
                        already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setMode("signIn")}
                          className="font-semibold text-[#5f3d4e] underline hover:text-[#8c5e6c]"
                        >
                          sign in
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>

              {/* Right Column (Visible side-by-side on desktop): Newsletters/Updates container */}
              <div className="lg:col-span-5 flex flex-col justify-center h-full border-t border-gray-100 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                <div className="hidden lg:flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-6 w-full">
                  <span className="h-px flex-1 bg-gray-200" />
                  <span>Stay Connected</span>
                  <span className="h-px flex-1 bg-gray-200" />
                </div>

                <div className="w-full rounded-3xl border border-gray-100 bg-[#faf5f6] p-5 text-center">
                  <p className="mb-4 text-xs font-medium text-gray-700 tracking-wide">
                    sign up for updates:
                  </p>
                  <form
                    className="flex w-full flex-col gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setNewsletterEmail("");
                    }}
                  >
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="email address"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-gray-400"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-xl border border-gray-800 bg-white py-2 text-xs uppercase tracking-[0.18em] text-gray-900 hover:bg-gray-900 hover:text-white transition"
                    >
                      submit
                    </button>
                  </form>
                  <p className="mt-3 text-[10px] text-gray-400 leading-relaxed">
                    by signing up you agree to our{" "}
                    <a href="#" className="underline hover:text-gray-600">
                      terms
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
