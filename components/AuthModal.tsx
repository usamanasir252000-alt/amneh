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
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-[2rem] bg-white/95 p-5 shadow-2xl ring-1 ring-gray-200 backdrop-blur-xl transition-all [max-height:92vh] sm:p-6 md:p-8 lg:max-w-4xl lg:p-10 xl:[max-height:85vh]"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close auth modal"
              className="absolute right-4 top-4 z-10 rounded-full border border-gray-200 bg-white/90 p-1.5 text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 sm:p-2"
            >
              <svg
                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
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

            {/* Inner Content Area - Grid Layout */}
            <div className="grid h-full items-center gap-4 overflow-y-auto pr-1 sm:gap-6 lg:grid-cols-12 lg:gap-8 lg:overflow-visible">
              {/* Left Column: Main Authentication Forms */}
              <div className="flex flex-col justify-center lg:col-span-7 mx-auto w-full max-w-md h-full">
                {/* Branding Block */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 xl:h-24 xl:w-24 transition-all">
                    <Image
                      src="/logo.svg"
                      alt="amneh logo"
                      fill
                      priority
                      className="object-contain"
                    />
                  </div>

                  <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[#9f7c89] sm:text-xs">
                    {mode === "signIn" ? "welcome back" : "new here?"}
                  </p>
                  <h2 className="mt-1 text-lg font-bold uppercase tracking-[0.12em] text-[#8c5e6c] sm:text-xl md:text-2xl lg:text-3xl">
                    {mode === "signIn" ? "sign in" : "create an account"}
                  </h2>
                </div>

                {/* Form Elements with fluid vertical margin/spacing scales */}
                <form
                  className="mt-4 flex flex-col gap-2 sm:mt-5 sm:gap-3 md:gap-4"
                  onSubmit={handleSubmit}
                >
                  {mode === "signUp" && (
                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                      <label className="block">
                        <span className="mb-0.5 block text-[10px] font-semibold text-gray-600 sm:text-xs">
                          first name
                        </span>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(event) => setFirstName(event.target.value)}
                          placeholder="first name"
                          className="w-full rounded-xl border border-gray-300 bg-white/80 px-3 py-1.5 text-xs text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100 sm:px-4 sm:py-2.5 sm:text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-0.5 block text-[10px] font-semibold text-gray-600 sm:text-xs">
                          last name
                        </span>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(event) => setLastName(event.target.value)}
                          placeholder="last name"
                          className="w-full rounded-xl border border-gray-300 bg-white/80 px-3 py-1.5 text-xs text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100 sm:px-4 sm:py-2.5 sm:text-sm"
                        />
                      </label>
                    </div>
                  )}

                  <label className="block">
                    <span className="mb-0.5 block text-[10px] font-semibold text-gray-600 sm:text-xs">
                      email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="email"
                      className="w-full rounded-xl border border-gray-300 bg-white/80 px-3 py-1.5 text-xs text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100 sm:px-4 sm:py-2.5 sm:text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-0.5 block text-[10px] font-semibold text-gray-600 sm:text-xs">
                      password
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="password"
                      className="w-full rounded-xl border border-gray-300 bg-white/80 px-3 py-1.5 text-xs text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100 sm:px-4 sm:py-2.5 sm:text-sm"
                    />
                  </label>

                  {mode === "signUp" && (
                    <label className="block">
                      <span className="mb-0.5 block text-[10px] font-semibold text-gray-600 sm:text-xs">
                        re-enter password
                      </span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        placeholder="re-enter password"
                        className="w-full rounded-xl border border-gray-300 bg-white/80 px-3 py-1.5 text-xs text-gray-700 outline-none transition focus:border-gray-600 focus:ring-2 focus:ring-gray-100 sm:px-4 sm:py-2.5 sm:text-sm"
                      />
                    </label>
                  )}

                  {/* Context Links Section */}
                  <div className="flex items-center justify-between min-h-[20px]">
                    {mode === "signUp" ? (
                      <label className="flex items-start gap-2 text-[10px] text-gray-700 sm:text-xs">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(event) =>
                            setAgreeTerms(event.target.checked)
                          }
                          className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-[#8c5e6c] focus:ring-[#8c5e6c]"
                        />
                        <span className="leading-tight">
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
                      <>
                        <span className="text-xs">&nbsp;</span>
                        <a
                          href="#"
                          className="text-[10px] text-[#5f3d4e] underline hover:text-[#8c5e6c] sm:text-xs"
                        >
                          forgot password?
                        </a>
                      </>
                    )}
                  </div>

                  {/* Main Action Call */}
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-[#8c5e6c] bg-[#f8e8ed] px-4 py-2 text-xs uppercase tracking-[0.15em] text-[#5f3d4e] transition hover:bg-[#e9d1d8] hover:text-[#6a4353] sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm sm:tracking-[0.2em]"
                  >
                    {mode === "signIn" ? "sign in" : "create account"}
                  </button>

                  {/* Switch View Trigger */}
                  <div className="text-center text-[11px] text-gray-600 sm:text-xs">
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

              {/* Right Column: Promotional/Newsletter section */}
              <div className="flex flex-col justify-center h-full border-t border-gray-100 pt-4 lg:col-span-5 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0 xl:pl-8">
                <div className="hidden lg:flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-gray-400 mb-4 w-full xl:mb-6">
                  <span className="h-px flex-1 bg-gray-200" />
                  <span>Stay Connected</span>
                  <span className="h-px flex-1 bg-gray-200" />
                </div>

                <div className="w-full rounded-2xl border border-gray-100 bg-[#faf5f6] p-4 text-center sm:p-5">
                  <p className="mb-2 text-[11px] font-medium text-gray-700 tracking-wide sm:mb-3 sm:text-xs">
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
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-gray-400 sm:rounded-xl sm:px-4 sm:py-2"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-gray-800 bg-white py-1.5 text-[10px] uppercase tracking-[0.15em] text-gray-900 hover:bg-gray-900 hover:text-white transition sm:rounded-xl sm:py-2 sm:text-xs"
                    >
                      submit
                    </button>
                  </form>
                  <p className="mt-2 text-[9px] text-gray-400 leading-relaxed sm:mt-3">
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
