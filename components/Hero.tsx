"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const heroImages = ["/f4.png", "/c13.png", "/f2.png"];

export default function Hero() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((i) => (i + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[100svh] w-full overflow-hidden">
      {/* Hero images — all stacked, cross-fade + slow Ken Burns zoom */}
      {heroImages.map((src, i) => {
        const isActive = i === activeIdx;
        return (
          <motion.div
            key={src}
            className="absolute inset-0"
            style={{ zIndex: isActive ? 1 : 0 }}
            initial={false}
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={
              isActive
                ? { duration: 1.1, ease: "easeInOut" }
                // Outgoing slide stays opaque underneath until the incoming
                // one has fully covered it, then snaps to hidden — no dark dip
                : { duration: 0, delay: 1.1 }
            }
          >
            {src === "/f2.png" ? (
              <>
                <Image
                  src="/c9.png"
                  alt="amneh collection"
                  fill
                  className="object-cover object-top block md:hidden"
                  quality={100}
                  sizes="(max-width: 768px) 300vw, 100vw"
                  priority={i === 0}
                />
                <Image
                  src="/f2.png"
                  alt="amneh collection"
                  fill
                  className="object-cover object-center hidden md:block"
                  quality={100}
                  sizes="100vw"
                />
              </>
            ) : (
              <Image
                src={src}
                alt="amneh collection"
                fill
                className="object-cover object-top md:object-center"
                priority={i === 0}
                quality={100}
                sizes="(max-width: 768px) 300vw, 100vw"
              />
            )}
          </motion.div>
        );
      })}

      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/10 to-transparent md:bg-gradient-to-r md:from-black/50 md:via-black/20 md:to-transparent" />

      {/* Text content — bottom-left on desktop, centered on mobile */}
      <div className="relative z-20 flex h-full items-end justify-start px-6 pb-10 text-left md:justify-start md:px-16 md:pb-20 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: "easeOut" }}
          className="w-full max-w-md text-white text-left md:w-auto"
        >
          <p className="text-[10px] uppercase tracking-[0.38em] text-white/60 mb-2 md:text-xs md:text-white/70 md:mb-3">
            just dropped
          </p>
          <h1 className="text-[2rem] leading-[1.08] sm:text-6xl font-bold uppercase tracking-tight md:leading-tight mb-3 md:mb-5">
            Amneh Serum
            <br />
            Collection
          </h1>
          <p className="text-[13px] leading-6 text-white/70 mb-6 max-w-[17rem] md:text-sm md:leading-7 md:text-white/80 md:mb-8 md:max-w-xs">
            meet our new juicy, long-lasting <strong>hydrating serum</strong>{" "}
            and nourishing, glow-rich <strong></strong>
          </p>
          <a
            href="#products"
            className="flex w-full items-center justify-center border border-white bg-white px-8 py-3.5 text-xs uppercase tracking-[0.22em] text-gray-900 hover:bg-transparent hover:text-white transition duration-300 md:inline-flex md:w-auto md:py-3"
          >
            shop now
          </a>
        </motion.div>
      </div>
    </section>
  );
}
