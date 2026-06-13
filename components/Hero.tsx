"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
    <section className="relative h-screen w-full overflow-hidden">
      {/* Hero images with glow transition effect */}
      <AnimatePresence mode="wait">
        {heroImages.map(
          (src, i) =>
            i === activeIdx && (
              <motion.div
                key={src}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  boxShadow: "inset 0 0 60px rgba(255, 255, 255, 0.1)",
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                {src === '/f2.png' ? (
                  <>
                    <Image
                      src="/c9.png"
                      alt="amneh collection"
                      fill
                      className="object-cover object-top block md:hidden"
                      priority={i === 0}
                      quality={100}
                      sizes="(max-width: 768px) 200vw, 100vw"
                    />
                    <Image
                      src="/f2.png"
                      alt="amneh collection"
                      fill
                      className="object-cover object-center hidden md:block"
                      priority={i === 0}
                      quality={90}
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
                    sizes="(max-width: 768px) 200vw, 100vw"
                  />
                )}
              </motion.div>
            ),
        )}
      </AnimatePresence>

      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

      {/* Text content — bottom-left on desktop, centered on mobile */}
      <div className="relative z-20 flex h-full items-end justify-center px-6 pb-20 text-center md:justify-start md:px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: "easeOut" }}
          className="max-w-md text-white md:text-left"
        >
          <p className="text-xs uppercase tracking-[0.38em] text-white/70 mb-3">
            just dropped
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold uppercase tracking-tight leading-tight mb-5">
            Amneh Serum
            <br />
            Collection
          </h1>
          <p className="text-sm leading-7 text-white/80 mb-8 max-w-xs">
            meet our new juicy, long-lasting <strong>hydrating serum</strong>{" "}
            and nourishing, glow-rich <strong></strong>
          </p>
          <a
            href="#products"
            className="inline-flex items-center justify-center border border-white bg-white px-8 py-3 text-xs uppercase tracking-[0.22em] text-gray-900 hover:bg-transparent hover:text-white transition duration-300"
          >
            shop now
          </a>
        </motion.div>
      </div>
    </section>
  );
}
