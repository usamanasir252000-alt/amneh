'use client';

import Image from "next/image";
import { RevealText, FadeUp } from "@/components/ui/Reveal";
import { useInView } from "@/hooks/useInView";

const feedImages = [
  { src: "/c2.png", alt: "amneh look 1" },
  { src: "/c3.png", alt: "amneh look 2" },
  { src: "/c4.png", alt: "amneh look 3" },
  { src: "/c12.png", alt: "amneh look 4" },
];

function FeedImage({ src, alt, delay }: { src: string; alt: string; delay: number }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className="relative aspect-square overflow-hidden group cursor-pointer"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'scale(1) translateY(0)' : 'scale(1.05) translateY(18px)',
        transition: `opacity 800ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 900ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-center transition duration-700 group-hover:scale-105"
        sizes="25vw"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition duration-500" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500">
        <span className="text-white text-xs tracking-[0.25em] uppercase font-medium">view</span>
      </div>
    </div>
  );
}

export default function SocialFeed() {
  return (
    <section className="bg-[#f1efef]">
      {/* Editorial header */}
      <div className="text-center py-12 px-6">
        <FadeUp delay={0} duration={600} distance={14}>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-3">community</p>
        </FadeUp>

        <RevealText
          lines={['#amneh']}
          tag="h2"
          className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-gray-900"
          delay={80}
        />

        <FadeUp delay={200} duration={600} distance={12}>
          <div className="mx-auto mt-4 h-px w-12 bg-gray-300" />
          <p className="mt-4 text-sm text-gray-500 tracking-wide">Real results, real people.</p>
        </FadeUp>
      </div>

      {/* Grid — each image reveals with a stagger */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        {feedImages.map((img, i) => (
          <FeedImage key={i} src={img.src} alt={img.alt} delay={i * 100} />
        ))}
      </div>

      {/* Instagram CTA */}
      <FadeUp delay={0} duration={700} className="py-8 flex justify-center">
        <a
          href="https://instagram.com/amnehofficial"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 border border-gray-900 px-8 py-3 text-[11px] uppercase tracking-[0.25em] text-gray-900 hover:bg-gray-900 hover:text-white transition duration-300"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          follow @amneh
        </a>
      </FadeUp>
    </section>
  );
}
