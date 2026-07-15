'use client';

import Image from 'next/image';
import { useInView } from '@/hooks/useInView';
import { RevealText, FadeUp } from '@/components/ui/Reveal';
import BackgroundVideo from '@/components/BackgroundVideo';
import { FEATURE_VIDEO } from '@/lib/testimonials';

export default function FeatureSplit() {
  const { ref: imgRef, inView: imgInView } = useInView(0.1);
  const hasVideo = FEATURE_VIDEO !== null;

  return (
    <section id="collections" className="relative w-full overflow-hidden">

      {/* ── Mobile layout ─────────────────────────────────────────────── */}
      <div className="md:hidden relative min-h-[78vh] flex flex-col justify-end">
        {/* Full-bleed media — UGC video if configured, else product image */}
        {hasVideo ? (
          <BackgroundVideo video={FEATURE_VIDEO!} eager />
        ) : (
          <Image
            src="/c5.webp"
            alt="Intense Hydration Serum"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        )}
        {/* Subtle bottom-only gradient so text stays legible over the media */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Text pinned bottom-left */}
        <div className="relative z-10 px-8 pb-12">
          <FadeUp delay={0} duration={600} distance={16} className="mb-4">
            <span className="text-xs uppercase tracking-[0.35em] text-white/60">
              Skincare Collection
            </span>
          </FadeUp>
          <RevealText
            lines={['Luminous,', 'Nourishing', 'Skin Care']}
            tag="h2"
            className="text-4xl font-bold uppercase tracking-tight leading-[1.05] text-white mb-4"
            delay={80}
            stagger={120}
          />
          <FadeUp delay={400} duration={700} className="mb-6">
            <p className="text-white/75 text-sm leading-relaxed max-w-[260px]">
              Science-backed formulas that hydrate, brighten, and transform your skin every day.
            </p>
          </FadeUp>
          <FadeUp delay={540} duration={700}>
            <a
              href="#products"
              className="inline-flex items-center justify-center border border-white bg-transparent px-7 py-3 text-xs uppercase tracking-[0.2em] text-white hover:bg-white hover:text-gray-900 transition duration-300"
            >
              Shop Now
            </a>
          </FadeUp>
        </div>
      </div>

      {/* ── Desktop layout ─────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-row min-h-[680px]">
        {/* Left: white text panel */}
        <div className="flex flex-col justify-center px-10 lg:px-16 py-20 w-5/12 bg-white">
          <FadeUp delay={0} duration={600} distance={16} className="mb-5">
            <span className="text-xs uppercase tracking-[0.35em] text-gray-400">
              Skincare Collection
            </span>
          </FadeUp>
          <RevealText
            lines={['Luminous,', 'Nourishing', 'Skin Care']}
            tag="h2"
            className="text-5xl lg:text-6xl font-bold uppercase tracking-tight leading-[1.05] text-gray-900 mb-6"
            delay={80}
            stagger={120}
          />
          <FadeUp delay={480} duration={700} className="mb-8">
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Science-backed formulas that hydrate, brighten, and transform your skin every day.
            </p>
          </FadeUp>
          <FadeUp delay={620} duration={700}>
            <a
              href="#products"
              className="inline-flex items-center justify-center border border-gray-900 bg-transparent px-8 py-3.5 text-xs uppercase tracking-[0.2em] text-gray-900 hover:bg-gray-900 hover:text-white transition duration-300 self-start"
            >
              Shop Now
            </a>
          </FadeUp>
        </div>

        {/* Right: UGC video if configured, else product image */}
        <div ref={imgRef} className="w-7/12 relative bg-[#c9c9c9] overflow-hidden">
          {hasVideo ? (
            <BackgroundVideo video={FEATURE_VIDEO!} zoom eager />
          ) : (
            <Image
              src="/c5.webp"
              alt="Intense Hydration Serum"
              fill
              sizes="58vw"
              className="object-cover object-center"
              style={{
                transform: imgInView ? 'scale(1)' : 'scale(1.06)',
                transition: 'transform 1100ms cubic-bezier(0.16, 1, 0.3, 1) 100ms',
              }}
            />
          )}
        </div>
      </div>

    </section>
  );
}
