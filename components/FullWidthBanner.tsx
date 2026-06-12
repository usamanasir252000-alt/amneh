'use client';

import Image from "next/image";
import { RevealText, FadeUp } from "@/components/ui/Reveal";

export default function FullWidthBanner() {
  return (
    <section className="relative w-full overflow-hidden" style={{ height: "clamp(460px, 65vh, 700px)" }}>
      <Image
        src="/f13.png"
        alt="The essentials collection"
        fill
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

      <div className="relative z-10 flex h-full items-end px-10 pb-14 lg:px-20 lg:pb-20">
        <div className="max-w-sm">

          <FadeUp delay={0} duration={600} distance={16}>
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/60 mb-4">
              bestsellers
            </p>
          </FadeUp>

          <RevealText
            lines={['The', 'Essentials']}
            tag="h2"
            className="text-4xl sm:text-5xl font-bold uppercase tracking-tight leading-none text-white mb-5"
            delay={80}
            stagger={120}
          />

          <FadeUp delay={400} duration={700}>
            <p className="text-sm text-white/70 leading-7 mb-7 max-w-[220px]">
              Warm, fresh, and radiant — discover our best-selling beauty essentials.
            </p>
          </FadeUp>

          <FadeUp delay={540} duration={700}>
            <a
              href="#products"
              className="inline-flex items-center justify-center border border-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] text-white hover:bg-white hover:text-gray-900 transition duration-300"
            >
              shop now
            </a>
          </FadeUp>

        </div>
      </div>
    </section>
  );
}
