"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const heroImages = [
  "/r1.jpg",
  "/background1.jpeg",
  "/backgorund2.jpeg",
  "/r5.jpg",
];

export default function Hero() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((i) => (i + 1) % heroImages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* All hero images stacked — only active one is visible (instant cut) */}
      {heroImages.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0"
          style={{ opacity: i === activeIdx ? 1 : 0 }}
        >
          <Image
            src={src}
            alt="amneh collection"
            fill
            className="object-cover object-center"
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

      {/* Text content — bottom-left, slightly inset like Kylie */}
      <div className="relative z-20 flex h-full items-end pb-20 pl-16 lg:pl-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: "easeOut" }}
          className="max-w-md text-white"
        >
          <p className="text-xs uppercase tracking-[0.38em] text-white/70 mb-3">
            just dropped
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold uppercase tracking-tight leading-tight mb-5">
            Luxury Beauty<br />Essentials
          </h1>
          <p className="text-sm leading-7 text-white/80 mb-8 max-w-xs">
            meet our new juicy, long-lasting{" "}
            <strong>hydrating serum</strong> and nourishing, glow-rich{" "}
            <strong>velvet balm</strong>.
          </p>
          <a
            href="#collections"
            className="inline-flex items-center justify-center border border-white bg-white px-8 py-3 text-xs uppercase tracking-[0.22em] text-gray-900 hover:bg-transparent hover:text-white transition duration-300"
          >
            shop now
          </a>
        </motion.div>
      </div>
    </section>
  );
}
