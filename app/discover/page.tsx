import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import BackButton from "@/components/BackButton";

export default function DiscoverPage() {
  return (
    <main className="bg-[#f0f8fc] min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="relative h-[55vh] min-h-[360px] overflow-hidden mt-0">
        <Image src="/r1.jpg" alt="amneh discover" fill className="object-cover object-center" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        <div className="absolute top-24 left-6 z-20">
          <BackButton light />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-end pb-16 text-center px-6">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70 mb-3">our story</p>
          <h1 className="text-5xl sm:text-6xl font-bold uppercase tracking-tight text-white">Discover Amneh</h1>
        </div>
      </div>

      {/* Our Story */}
      <section className="max-w-3xl mx-auto px-6 py-20 lg:px-10">
        <p className="text-xs uppercase tracking-[0.35em] text-[#4d9ab5] mb-6">the beginning</p>
        <h2 className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-10 leading-snug">
          Honest. Gentle.<br />Intentional.
        </h2>

        <div className="space-y-6 text-[15px] leading-8 text-gray-600">
          <p>
            Amneh was created from a simple belief — that skincare should feel honest, gentle, and intentional.
            In a world full of complicated routines and overwhelming choices, we wanted to bring things back to
            simplicity. Products that respect your skin, your time, and your natural beauty.
          </p>
          <p>
            The name <strong className="text-gray-800">Amneh</strong> represents trust, purity, and care — values
            that sit at the heart of everything we create. Each formula is thoughtfully developed to nourish and
            support your skin, without unnecessary additives or noise. We don't believe in covering up imperfections.
            We believe in enhancing what's already yours.
          </p>
          <p>
            Amneh is more than skincare. It's a quiet ritual of self-respect, designed to help you feel comfortable
            in your own skin, every single day.
          </p>
        </div>
      </section>

      {/* Divider image */}
      <div className="relative h-[40vh] min-h-[280px] overflow-hidden">
        <Image src="/r7.jpg" alt="amneh ingredients" fill className="object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex h-full items-center justify-center">
          <p className="text-white text-2xl font-bold uppercase tracking-[0.25em]">Nature Meets Science</p>
        </div>
      </div>

      {/* Fruit-based extracts */}
      <section className="max-w-5xl mx-auto px-6 py-20 lg:px-10">
        <p className="text-xs uppercase tracking-[0.35em] text-[#4d9ab5] mb-4 text-center">what's inside</p>
        <h2 className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-4 text-center">
          Powered by Nature
        </h2>
        <p className="text-center text-gray-500 text-sm leading-7 mb-14 max-w-xl mx-auto">
          Every amneh. formula is built around plant-derived, fruit-based extracts chosen for their proven ability
          to nourish, brighten, and protect.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: "Rosehip Extract",
              origin: "Chile & South Africa",
              benefit: "Rich in vitamins A and C, rosehip oil deeply repairs the skin barrier, fades dark spots, and delivers lasting hydration.",
              emoji: "🌹",
            },
            {
              name: "Pomegranate Seed Oil",
              origin: "Mediterranean",
              benefit: "Packed with antioxidants and punicic acid, it shields skin from environmental stress and promotes cell renewal.",
              emoji: "🍎",
            },
            {
              name: "Papaya Enzyme",
              origin: "Tropical Regions",
              benefit: "Papain gently exfoliates dead skin cells, evens tone, and reveals a smoother, more luminous complexion.",
              emoji: "🍈",
            },
            {
              name: "Sea Buckthorn Berry",
              origin: "Himalayas & Europe",
              benefit: "One of nature's most nutrient-dense berries — packed with omegas 3, 6, 7, and 9 for intensive skin repair.",
              emoji: "🫐",
            },
            {
              name: "Green Tea Extract",
              origin: "East Asia",
              benefit: "A powerful antioxidant that calms inflammation, minimises pores, and protects against UV-induced damage.",
              emoji: "🍵",
            },
            {
              name: "Hyaluronic Acid (Plant-Derived)",
              origin: "Fermented Botanical",
              benefit: "Draws moisture from the environment into the skin, delivering 24-hour hydration at multiple skin layers.",
              emoji: "💧",
            },
          ].map((item) => (
            <div key={item.name} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl mb-4">{item.emoji}</div>
              <p className="text-[10px] uppercase tracking-widest text-[#4d9ab5] mb-1">{item.origin}</p>
              <h3 className="text-[15px] font-semibold text-gray-900 mb-3">{item.name}</h3>
              <p className="text-[13px] leading-6 text-gray-500">{item.benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Instagram CTA */}
      <section className="bg-white py-16 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-[#4d9ab5] mb-3">follow along</p>
        <h2 className="text-3xl font-bold uppercase tracking-tight text-gray-900 mb-4">Join the Community</h2>
        <p className="text-gray-500 text-sm leading-7 max-w-md mx-auto mb-8">
          Share your amneh. ritual, discover new looks, and connect with a community that believes in honest beauty.
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
      </section>

      <div style={{ background: "#9ac9df", height: "56px" }} />
      <Footer />
    </main>
  );
}
