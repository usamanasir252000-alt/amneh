import Image from "next/image";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const serums = [
  {
    id: 1,
    image: "/product2.jpeg",
    name: "intensive hydration serum",
    tagline: "24-hour moisture",
    description:
      "A powerhouse formula with hyaluronic acid and ceramides that delivers intense, long-lasting hydration and restores the skin barrier.",
    price: "$38",
    badge: "best seller",
  },
  {
    id: 2,
    image: "/r3.jpg",
    name: "glycolic night serum",
    tagline: "resurface + renew",
    description:
      "An overnight resurfacing serum with glycolic acid and niacinamide that smooths texture, minimises pores and evens skin tone.",
    price: "$42",
    badge: "new",
  },
  {
    id: 3,
    image: "/r4.jpg",
    name: "glutathione brightening serum",
    tagline: "illuminate + even",
    description:
      "A brightening serum packed with glutathione and vitamin C that targets dark spots and delivers a luminous, glass-skin glow.",
    price: "$45",
    badge: "new",
  },
];

const categories = ["new", "serums", "moisturizers", "toners", "best sellers"];

function Stars({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`h-3.5 w-3.5 ${i <= count ? "text-gray-700" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function SkincareePage() {
  return (
    <main className="bg-[#faf5f6]">
      <Navbar />

      {/* Category hero banner */}
      <div className="relative mt-[88px] h-[42vh] min-h-[280px] w-full overflow-hidden">
        <Image
          src="/background2.jpeg"
          alt="amneh skincare"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/15 to-transparent" />
        <div className="relative z-10 flex h-full items-end px-10 pb-10 lg:px-16">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/70 mb-2">collection</p>
            <h1 className="text-5xl font-bold uppercase tracking-tight text-white">
              Skincare
            </h1>
          </div>
        </div>
      </div>

      {/* Sub-category nav */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-screen-xl items-center gap-8 overflow-x-auto px-8 py-4 scrollbar-hide">
          {categories.map((cat) => (
            <a
              key={cat}
              href={`#${cat.replace(" ", "-")}`}
              className={`shrink-0 text-[13px] tracking-wide transition hover:text-gray-900 ${
                cat === "serums"
                  ? "border-b-2 border-gray-900 pb-0.5 font-semibold text-gray-900"
                  : "text-gray-500"
              }`}
            >
              {cat}
            </a>
          ))}
        </div>
      </div>

      {/* Serums section */}
      <section id="serums" className="mx-auto max-w-screen-xl px-6 py-16 lg:px-10">
        <h2 className="mb-1 text-sm uppercase tracking-[0.3em] text-gray-400">amneh. skincare</h2>
        <h3 className="mb-10 text-3xl font-bold uppercase tracking-tight text-gray-900">
          Serums
        </h3>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {serums.map((serum) => (
            <div key={serum.id} className="group cursor-pointer">
              {/* Image */}
              <div className="relative overflow-hidden bg-[#f0ece8] aspect-[3/4]">
                <Image
                  src={serum.image}
                  alt={serum.name}
                  fill
                  className="object-cover object-center transition duration-600 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <span className="absolute right-3 top-3 bg-white px-2.5 py-1 text-[10px] uppercase tracking-wide text-gray-700">
                  {serum.badge}
                </span>
              </div>

              {/* Info */}
              <div className="mt-4 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <Stars count={serum.badge === "best seller" ? 5 : 4} />
                  <p className="mt-1.5 text-[15px] font-semibold text-gray-900">{serum.name}</p>
                  <p className="text-[13px] text-[#7d4f5a]">{serum.tagline}</p>
                  <p className="mt-2 text-[12px] leading-5 text-gray-500 line-clamp-2">
                    {serum.description}
                  </p>
                </div>
                <span className="mt-1 shrink-0 text-[15px] font-medium text-gray-900">
                  {serum.price}
                </span>
              </div>

              <button className="mt-4 w-full border border-gray-900 py-2.5 text-xs uppercase tracking-[0.2em] text-gray-900 transition duration-300 hover:bg-gray-900 hover:text-white">
                add to cart
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* "Shop all skincare" CTA */}
      <div className="flex justify-center pb-16">
        <a
          href="#"
          className="border border-gray-900 px-12 py-3 text-xs uppercase tracking-[0.22em] text-gray-900 hover:bg-gray-900 hover:text-white transition duration-300"
        >
          shop all skincare
        </a>
      </div>

      {/* Related section — use background1 as a full-width banner */}
      <div className="relative h-[50vh] min-h-[340px] w-full overflow-hidden">
        <Image
          src="/background1.jpeg"
          alt="amneh serums"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />
        <div className="relative z-10 flex h-full items-center px-12 lg:px-20">
          <div className="max-w-xs text-white">
            <h2 className="text-3xl font-bold uppercase tracking-tight" style={{ color: "#d4a8b4" }}>
              The Full<br />Routine
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/80">
              pair with our moisturizers and toners for a complete glow-boosting ritual.
            </p>
            <a
              href="#"
              className="mt-6 inline-flex items-center justify-center border border-white bg-white px-8 py-3 text-xs uppercase tracking-[0.22em] text-gray-900 hover:bg-transparent hover:text-white transition duration-300"
            >
              explore
            </a>
          </div>
        </div>
      </div>

      <div className="h-[6px]" style={{ background: "#f0e0e4" }} />
      <Footer />
    </main>
  );
}
