"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Playfair_Display } from "next/font/google";
import Navbar from "./Navbar";

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  weight: ["700"],
});

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background image fills the viewport */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/background.jpeg"
          alt="Luxury beauty collection background"
          fill
          className="h-full w-full object-cover object-center lg:object-right"
          priority
          sizes="100vw"
        />
      </div>

      {/* Overlay layers for readability and premium depth (10% black) */}
      <div className="absolute inset-0 z-10 bg-black/10" />
      <div className="absolute inset-0 z-20 bg-gradient-to-r from-black/10 via-[rgba(0,0,0,0.05)] to-transparent" />

      <Navbar />

      <div className="relative z-30 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-24 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, x: -48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="w-full text-center lg:w-2/5 lg:text-left "
        >
          <p className="text-sm uppercase tracking-[0.42em] text-white/80 sm:text-base">
            Luxury Beauty Collection
          </p>

          <h1
            className={`${playfair.className} mt-6 text-4xl font-bold tracking-[0.14em] text-white sm:text-6xl md:text-7xl xl:text-8xl`}
          >
            BEAUTY SHOPIFY STORE
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-white/75 sm:text-lg lg:mx-0">
            Discover premium beauty products crafted for elegance and
            confidence. Experience a luxury store experience designed for modern
            cosmetics.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href="#collections"
              className="inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-900 transition duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_20px_60px_rgba(255,255,255,0.22)]"
            >
              Shop Now
            </a>
          </div>

          {/* <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 text-left shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-sm">
              <p className="text-3xl font-semibold text-white">120+</p>
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/60">
                curated products
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 text-left shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-sm">
              <p className="text-3xl font-semibold text-white">Premium</p>
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/60">
                beauty experience
              </p>
            </div>
          </div> */}
        </motion.div>
      </div>

      {/* Decorative gradient shapes */}
      <div className="pointer-events-none absolute left-8 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-pink-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-28 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-10 h-36 w-36 rounded-full bg-rose-300/25 blur-3xl" />
    </section>
  );
}
