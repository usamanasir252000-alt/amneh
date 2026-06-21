"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GoogleSignInButton from "@/components/GoogleSignInButton";

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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [verifySentTo, setVerifySentTo] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError("");
    }
  }, [open, initialMode]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    setLoading(true);
    try {
      const endpoint =
        mode === "signIn" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "signIn"
          ? { email, password }
          : { email, firstName, lastName };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else if (data.emailSent) {
        // Verification email sent — user will set their password from the
        // activation link.
        onClose();
        setVerifySentTo(email);
      } else {
        onClose();
        router.push("/");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {/* Verification email sent — confirmation popup */}
    <AnimatePresence>
      {verifySentTo ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setVerifySentTo("");
          }}
        >
          <motion.div
            className="relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-soft ring-1 ring-Deep_blue/20"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-light_blue">
              <svg
                className="h-7 w-7 text-Deep_blue"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-Deep_blue">
              Check your inbox
            </h3>
            <p className="text-sm leading-relaxed text-gray-500">
              We&apos;ve sent a verification link to{" "}
              <span className="font-semibold text-gray-700">{verifySentTo}</span>.
              Click the link to activate your account.
            </p>
            <button
              type="button"
              onClick={() => setVerifySentTo("")}
              className="mt-6 w-full rounded-2xl border border-Deep_blue bg-Deep_blue px-5 py-3 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-Deep_blue/90"
            >
              got it
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>

    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-[2rem] bg-white/95 p-5 shadow-soft ring-1 ring-Deep_blue/20 [max-height:92vh] sm:p-6 md:p-8 lg:max-w-4xl lg:p-10 xl:[max-height:85vh]"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close auth modal"
              className="absolute right-4 top-4 z-10 rounded-full border border-Deep_blue/20 bg-light_blue p-1.5 text-Deep_blue transition hover:bg-soft_blue focus:outline-none focus:ring-2 focus:ring-Deep_blue/30 sm:p-2"
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

            <div className="grid gap-8 items-center lg:grid-cols-12">
              {/* Left Column: Auth Form */}
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
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.3em] text-Deep_blue/70 sm:text-xs">
                    {mode === "signIn" ? "welcome back" : "new here?"}
                  </p>
                  <h2 className="mt-1 text-lg font-bold uppercase tracking-[0.12em] text-Deep_blue sm:text-xl md:text-2xl lg:text-3xl">
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
                        <span className="mb-0.5 block text-[10px] font-semibold text-Deep_blue/70 sm:text-xs">
                          first name
                        </span>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(event) => setFirstName(event.target.value)}
                          placeholder="first name"
                          required
                          className="w-full rounded-xl border border-Deep_blue/20 bg-light_blue px-4 py-2.5 text-sm text-Deep_blue outline-none transition focus:border-Deep_blue focus:ring-2 focus:ring-Deep_blue/20"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-0.5 block text-[10px] font-semibold text-Deep_blue/70 sm:text-xs">
                          last name
                        </span>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(event) => setLastName(event.target.value)}
                          placeholder="last name"
                          className="w-full rounded-xl border border-Deep_blue/20 bg-light_blue px-3 py-1.5 text-xs text-Deep_blue outline-none transition focus:border-Deep_blue focus:ring-2 focus:ring-Deep_blue/20 sm:px-4 sm:py-2.5 sm:text-sm"
                        />
                      </label>
                    </div>
                  )}

                  <label className="block">
                    <span className="mb-0.5 block text-[10px] font-semibold text-Deep_blue/70 sm:text-xs">
                      email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="email"
                      required
                      className="w-full rounded-xl border border-Deep_blue/20 bg-light_blue px-4 py-2.5 text-sm text-Deep_blue outline-none transition focus:border-Deep_blue focus:ring-2 focus:ring-Deep_blue/20"
                    />
                  </label>

                  {mode === "signIn" && (
                    <label className="block">
                      <span className="mb-0.5 block text-[10px] font-semibold text-Deep_blue/70 sm:text-xs">
                        password
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="password"
                        required
                        className="w-full rounded-xl border border-Deep_blue/20 bg-light_blue px-4 py-2.5 text-sm text-Deep_blue outline-none transition focus:border-Deep_blue focus:ring-2 focus:ring-Deep_blue/20"
                      />
                    </label>
                  )}

                  {mode === "signUp" && (
                    <>
                      <label className="flex items-start gap-3 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(event) =>
                            setAgreeTerms(event.target.checked)
                          }
                          required
                          className="mt-0.5 h-4 w-4 rounded border-Deep_blue/20 text-Deep_blue focus:ring-Deep_blue"
                        />
                        <span>
                          i agree to amneh&apos;s terms and privacy policy.
                        </span>
                      </label>
                    </>
                  )}

                  {error && (
                    <p className="text-xs text-red-500 text-center">{error}</p>
                  )}

                  {/* Main Action Call */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl border border-Deep_blue bg-Deep_blue px-5 py-3 text-sm uppercase tracking-[0.2em] text-white transition hover:bg-Deep_blue/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? mode === "signIn"
                        ? "signing in…"
                        : "creating account…"
                      : mode === "signIn"
                        ? "sign in"
                        : "create account"}
                  </button>

                  <div className="mt-4">
                    <GoogleSignInButton onClose={onClose} />
                  </div>

                  {/* Switch View Trigger */}
                  <div className="text-center text-[11px] text-gray-600 sm:text-xs">
                    {mode === "signIn" ? (
                      <>
                        don&apos;t have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setMode("signUp");
                            setError("");
                          }}
                          className="font-semibold text-Deep_blue underline hover:text-soft_blue"
                        >
                          sign up
                        </button>
                      </>
                    ) : (
                      <>
                        already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setMode("signIn");
                            setError("");
                          }}
                          className="font-semibold text-Deep_blue underline hover:text-soft_blue"
                        >
                          sign in
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>

              {/* Right Column: Newsletter */}
              <div className="lg:col-span-5 flex flex-col justify-center h-full border-t border-Deep_blue/10 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                <div className="hidden lg:flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-Deep_blue/40 mb-6 w-full">
                  <span className="h-px flex-1 bg-Deep_blue/10" />
                  <span>Stay Connected</span>
                  <span className="h-px flex-1 bg-Deep_blue/10" />
                </div>

                <div className="w-full rounded-3xl border border-Deep_blue/10 bg-light_blue p-5 text-center">
                  <p className="mb-4 text-xs font-medium text-Deep_blue tracking-wide">
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
                      className="w-full rounded-xl border border-Deep_blue/20 bg-white px-3 py-1.5 text-xs text-Deep_blue placeholder-Deep_blue/40 outline-none focus:border-Deep_blue focus:ring-Deep_blue/20 sm:px-4 sm:py-2"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-Deep_blue py-2 text-[10px] uppercase tracking-[0.15em] text-white transition hover:bg-Deep_blue/90 sm:text-xs"
                    >
                      submit
                    </button>
                  </form>
                  <p className="mt-3 text-[10px] text-Deep_blue/50 leading-relaxed">
                    by signing up you agree to our terms.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
    </>
  );
}
