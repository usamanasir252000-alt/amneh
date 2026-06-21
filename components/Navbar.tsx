"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import AuthModal from "@/components/AuthModal";

interface NavUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  loyaltyPoints: number;
}

const navItems = [
  { label: "skincare", href: "/skincare" },
  { label: "discover", href: "/discover" },
  { label: "rewards", href: "/rewards" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<NavUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getTotalItems, openCart } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((u) => setUser(u || null))
      .catch(() => setUser(null));
  }, [authModalOpen, pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
    setUser(null);
    setDropdownOpen(false);
    setIsOpen(false);
    // Full reload guarantees the cleared cookie is re-read and no stale
    // client/auth state survives.
    window.location.assign("/");
  };
  const isSkincarePage = pathname === "/skincare";
  const useDarkNav = scrolled || isSkincarePage;
  const textColor = useDarkNav ? "text-gray-600" : "text-white/85";
  const iconColor = useDarkNav ? "text-gray-700" : "text-white";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        useDarkNav
          ? "bg-white shadow-[0_1px_0_rgba(0,0,0,0.07)]"
          : "bg-transparent"
      }`}
    >
      <div className="relative mx-auto flex max-w-screen-xl items-center justify-between px-5 py-4">
        <div />

        {/* Center: logo */}
        <a href="/" className="absolute left-1/2 -translate-x-1/2">
          <img
            src="/logo.svg"
            alt="amneh."
            className={`h-8 w-auto transition-all duration-300 ${!useDarkNav ? "brightness-0 invert" : ""}`}
          />
        </a>

        {/* Right: icons */}
        <div
          className={`flex items-center gap-3 transition-colors duration-300 ${iconColor}`}
        >
          {/* Profile / Account */}
          {user ? (
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((p) => !p)}
                aria-label="Profile"
                className="hover:opacity-70 transition-opacity flex items-center gap-1.5"
              >
                <svg
                  className="h-[18px] w-[18px]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-3 w-44 rounded-xl bg-white shadow-lg border border-gray-100 py-1.5 z-50"
                  >
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                        signed in as
                      </p>
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user.firstName}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              aria-label="Account"
              className="hidden hover:opacity-70 sm:block transition-opacity"
              type="button"
              onClick={() => setAuthModalOpen(true)}
            >
              <svg
                className="h-[18px] w-[18px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </button>
          )}

          {/* Cart */}
          <button
            onClick={openCart}
            aria-label="Cart"
            className="relative hover:opacity-70 transition-opacity"
            type="button"
          >
            <svg
              className="h-[18px] w-[18px]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <AnimatePresence>
              {getTotalItems() > 0 && (
                <motion.div
                  key={`badge-${getTotalItems()}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute -top-2 -right-2 w-5 h-5 min-w-5 min-h-5 rounded-full bg-rose-400 text-white text-[11px] font-bold flex items-center justify-center leading-none flex-shrink-0"
                >
                  {getTotalItems()}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Hamburger */}
          <button
            className="ml-1 hover:opacity-70 transition-opacity lg:hidden"
            onClick={() => setIsOpen((p) => !p)}
            aria-label="Menu"
            type="button"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop nav row */}
      <nav
        className={`hidden border-t lg:flex items-center justify-center gap-12 py-3 transition-colors duration-300 ${scrolled ? "border-gray-100/80" : "border-white/10"}`}
      >
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`text-[11px] uppercase tracking-[0.22em] transition-all duration-300 hover:opacity-100 ${textColor} opacity-80`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/15 bg-white/95 backdrop-blur-sm lg:hidden"
          >
            <div className="flex flex-col divide-y divide-gray-100">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-6 py-3.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    log out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full px-6 py-3.5 text-left text-sm font-semibold text-[#5f3d4e] hover:bg-gray-50"
                >
                  sign in / sign up
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AuthModal
        open={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
        }}
      />
    </header>
  );
}
