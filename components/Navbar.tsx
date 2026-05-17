"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import AuthModal from "@/components/AuthModal";

const navItems = [
  { label: "skincare", href: "/skincare" },
  { label: "fragrance", href: "#fragrance" },
  { label: "makeup", href: "#makeup" },
  { label: "discover", href: "#discover" },
  { label: "rewards", href: "#rewards" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { getTotalItems, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pathname = usePathname();
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
      <div className="relative mx-auto flex max-w-screen-xl items-center justify-between px-5 py-3">
        {/* Left: country */}
        <div
          className={`flex items-center gap-1.5 text-xs transition-colors duration-300 ${useDarkNav ? "text-gray-500" : "text-white/75"}`}
        >
          <span className="uppercase tracking-wide">us</span>
          <span
            className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border text-[10px] leading-none transition-colors duration-300 ${useDarkNav ? "border-gray-400" : "border-white/60"}`}
          >
            $
          </span>
        </div>

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
          <button
            aria-label="Wishlist"
            className="hidden hover:opacity-70 sm:block transition-opacity"
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
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
          <button
            aria-label="Search"
            className="hidden hover:opacity-70 sm:block transition-opacity"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
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
        className={`hidden border-t lg:flex items-center justify-center gap-10 py-2.5 transition-colors duration-300 ${scrolled ? "border-gray-100" : "border-white/15"}`}
      >
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`text-[13px] tracking-wide transition-all duration-300 hover:opacity-100 ${textColor} opacity-90`}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  );
}
