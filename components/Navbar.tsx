"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Collections", href: "#collections" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact Us", href: "#contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/10 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
        <a
          href="#home"
          className="flex items-center gap-3 font-semibold uppercase tracking-[0.32em] text-white"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-white/15 text-lg text-white shadow-soft">
            B
          </span>
          BEAUTLI
        </a>

        <nav className="hidden items-center gap-10 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium uppercase tracking-[0.25em] text-white transition hover:text-white/90"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15 lg:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle mobile menu"
        >
          <span className="relative block h-5 w-5">
            <span
              className={`absolute left-0 top-0 h-[2px] w-full rounded-full bg-white transition-transform ${isOpen ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`absolute left-0 top-2.5 h-[2px] w-full rounded-full bg-white transition-opacity ${isOpen ? "opacity-0" : "opacity-100"}`}
            />
            <span
              className={`absolute left-0 top-5 h-[2px] w-full rounded-full bg-white transition-transform ${isOpen ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="absolute inset-x-4 top-full z-20 mt-2 rounded-3xl bg-black/85 p-5 shadow-2xl shadow-black/20 ring-1 ring-white/10 lg:hidden"
          >
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="rounded-3xl px-4 py-3 text-sm font-medium uppercase tracking-[0.22em] text-white transition hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
