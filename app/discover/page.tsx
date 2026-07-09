"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import BackButton from "@/components/BackButton";
import { RevealText, FadeUp, ScaleIn } from "@/components/ui/Reveal";

const ingredients = [
  {
    name: "Apple Extract",
    origin: "Orchard-Grown Apples",
    benefit:
      "Rich in antioxidants and natural fruit acids that help refresh the skin, support hydration, and promote a healthy-looking glow.",
    emoji: "🍎",
  },
  {
    name: "Pineapple Ceramide",
    origin: "Tropical Pineapple",
    benefit:
      "Helps strengthen the skin barrier, lock in moisture, and improve skin softness for long-lasting hydration.",
    emoji: "🍍",
  },
  {
    name: "Strawberry Extract",
    origin: "Premium Strawberry Farms",
    benefit:
      "Packed with antioxidants that help brighten dull skin, soothe irritation, and support a radiant complexion.",
    emoji: "🍓",
  },
  {
    name: "Niacinamide",
    origin: "Vitamin B3 Complex",
    benefit:
      "Supports a stronger skin barrier, improves skin tone appearance, and helps maintain balanced-looking skin.",
    emoji: "✨",
  },
  {
    name: "Hyaluronic Acid",
    origin: "Plant-Derived Fermentation",
    benefit:
      "Attracts and retains moisture to deliver deep hydration and a plump, smooth skin appearance.",
    emoji: "💧",
  },
  {
    name: "Vitamin B5 (Panthenol)",
    origin: "Pro-Vitamin Complex",
    benefit:
      "Provides soothing hydration while helping support skin comfort and barrier recovery.",
    emoji: "🌿",
  },
];

export default function DiscoverPage() {
  return (
    <main className="bg-[#f1efef] min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="relative h-[55vh] min-h-[360px] overflow-hidden mt-0">
        <div className="absolute inset-0 block sm:hidden">
          <Image
            src="/r9.png"
            alt="amneh discover mobile"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 hidden sm:block">
          <Image
            src="/f3.png"
            alt="amneh discover"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        <div className="absolute top-[132px] left-6 z-[60]">
          <BackButton light />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-end pb-16 text-center px-6">
          <FadeUp delay={200} duration={600} distance={14}>
            <p className="text-xs uppercase tracking-[0.4em] text-white/70 mb-3">
              our story
            </p>
          </FadeUp>
          <RevealText
            lines={["Discover Amneh"]}
            tag="h1"
            className="text-5xl sm:text-6xl font-bold uppercase tracking-tight text-white"
            delay={350}
          />
        </div>
      </div>

      {/* Our Story */}
      <section className="max-w-3xl mx-auto px-6 py-20 lg:px-10">
        <FadeUp delay={0} duration={600} distance={14}>
          <p className="text-xs uppercase tracking-[0.35em] text-[#4d9ab5] mb-6">
            the beginning
          </p>
        </FadeUp>

        <RevealText
          lines={["Honest. Gentle.", "Intentional."]}
          tag="h2"
          className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-10 leading-snug"
          delay={80}
          stagger={130}
        />

        <div className="space-y-6 text-[15px] leading-8 text-gray-600">
          <FadeUp delay={0} duration={700}>
            <p>
              Amneh was created from a simple belief — that skincare should feel
              honest, gentle, and intentional. In a world full of complicated
              routines and overwhelming choices, we wanted to bring things back
              to simplicity. Products that respect your skin, your time, and
              your natural beauty.
            </p>
          </FadeUp>
          <FadeUp delay={80} duration={700}>
            <p>
              The name <strong className="text-gray-800">Amneh</strong>{" "}
              represents trust, purity, and care — values that sit at the heart
              of everything we create. Each formula is thoughtfully developed to
              nourish and support your skin, without unnecessary additives or
              noise. We don't believe in covering up imperfections. We believe
              in enhancing what's already yours.
            </p>
          </FadeUp>
          <FadeUp delay={160} duration={700}>
            <p>
              Amneh is more than skincare. It's a quiet ritual of self-respect,
              designed to help you feel comfortable in your own skin, every
              single day.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* Divider image */}
      <div className="relative h-[40vh] min-h-[280px] overflow-hidden">
        <Image
          src="/r7.jpg"
          alt="amneh ingredients"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex h-full items-center justify-center">
          <RevealText
            lines={["Nature Meets Science"]}
            tag="p"
            className="text-white text-2xl font-bold uppercase tracking-[0.25em]"
            delay={0}
          />
        </div>
      </div>

      {/* Ingredients grid */}
      <section className="max-w-5xl mx-auto px-6 py-20 lg:px-10">
        <FadeUp delay={0} duration={600} distance={14} className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#4d9ab5] mb-4">
            what's inside
          </p>
        </FadeUp>

        <RevealText
          lines={["Powered by Nature"]}
          tag="h2"
          className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-4 text-center"
          delay={80}
        />

        <FadeUp
          delay={200}
          duration={700}
          distance={16}
          className="text-center mb-14"
        >
          <p className="text-gray-500 text-sm leading-7 max-w-xl mx-auto">
            Every amneh. formula is built around plant-derived, fruit-based
            extracts chosen for their proven ability to nourish, brighten, and
            protect.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {ingredients.map((item, i) => (
            <ScaleIn key={item.name} delay={i * 90} threshold={0.05}>
              <div className="bg-white rounded-xl p-6 shadow-sm h-full">
                <div className="text-3xl mb-4">{item.emoji}</div>
                <p className="text-[10px] uppercase tracking-widest text-[#4d9ab5] mb-1">
                  {item.origin}
                </p>
                <h3 className="text-[15px] font-semibold text-gray-900 mb-3">
                  {item.name}
                </h3>
                <p className="text-[13px] leading-6 text-gray-500">
                  {item.benefit}
                </p>
              </div>
            </ScaleIn>
          ))}
        </div>
      </section>

      {/* Instagram CTA */}
      <section className="bg-white py-16 px-6 text-center">
        <FadeUp delay={0} duration={600} distance={14}>
          <p className="text-xs uppercase tracking-[0.35em] text-[#4d9ab5] mb-3">
            follow along
          </p>
        </FadeUp>

        <RevealText
          lines={["Join the Community"]}
          tag="h2"
          className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-4"
          delay={80}
        />

        <FadeUp delay={220} duration={700}>
          <p className="text-gray-500 text-sm leading-7 max-w-md mx-auto mb-8">
            Share your amneh. ritual, discover new looks, and connect with a
            community that believes in honest beauty.
          </p>
          <a
            href="https://instagram.com/amnehofficial"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-gray-900 text-white px-8 py-3.5 text-xs uppercase tracking-widest hover:bg-gray-700 transition"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            @amnehofficial
          </a>
        </FadeUp>
      </section>

      <div style={{ background: "#f1efef", height: "56px" }} />
      <Footer />
    </main>
  );
}
