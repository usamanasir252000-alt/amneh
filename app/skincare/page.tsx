"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useCart } from "@/context/CartContext";
import { useState, useEffect, useRef } from "react";
import BackButton from "@/components/BackButton";
import ProductBadge from "@/components/ProductBadge";
import FreeShippingNote from "@/components/FreeShippingNote";
import { RevealText, FadeUp, ScaleIn } from "@/components/ui/Reveal";
import { fetchWithRetry } from "@/lib/fetchRetry";

interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

interface Product {
  id: string;
  handle: string;
  variantId: string;
  name: string;
  type: string;
  price: number;
  compareAtPrice: number | null;
  shades: string;
  badge: string;
  tagline: string | null;
  description: string | null;
  images: ProductImage[];
}

const categories = ["serums"];

function Stars({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`h-3.5 w-3.5 ${i <= count ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function SkincareProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);

  const images = product.images.length
    ? product.images
    : [{ id: "fallback", url: "/shot1.png", sortOrder: 0 }];
  const primaryImage = images[0].url;
  const hoverImage = images[1]?.url ?? null;
  const imgCount = images.length;
  const hasDiscount = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100) : 0;

  const handleAddToCart = () => {
    addItem({
      variantId: product.variantId,
      name: product.name,
      price: product.price,
      image: primaryImage,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="group">
      <Link href={`/products/${product.id}`} className="block">
        {/* ── Mobile: swipe carousel with dots ── */}
        <div
          className="md:hidden relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#dff0f8] to-[#fbeef2] aspect-[3/4] shadow-[0_10px_28px_rgba(95,61,78,0.08)]"
          style={{ touchAction: "pan-y" }}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const delta = touchStartX.current - e.changedTouches[0].clientX;
            if (delta > 45)
              setActiveIndex((i) => Math.min(i + 1, imgCount - 1));
            if (delta < -45) setActiveIndex((i) => Math.max(i - 1, 0));
          }}
        >
          <div
            className="flex h-full w-full transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {images.map((img) => (
              <div
                key={img.id}
                className="relative w-full h-full flex-shrink-0"
              >
                <Image
                  src={img.url}
                  alt={product.name}
                  fill
                  className="object-cover object-center"
                  sizes="48vw"
                />
              </div>
            ))}
          </div>

          <ProductBadge badge={product.badge} className="absolute right-3 top-3 z-10" />

          {imgCount > 1 && (
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveIndex(i);
                  }}
                  aria-label={`Image ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Desktop: hover image swap ── */}
        <div
          className="hidden md:block relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#dff0f8] to-[#fbeef2] aspect-[3/4] shadow-[0_10px_28px_rgba(95,61,78,0.08)] transition-shadow duration-300 group-hover:shadow-[0_20px_48px_rgba(95,61,78,0.16)]"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className={`object-cover object-center transition-all duration-500 ${hovered ? "scale-105" : "scale-100"} ${hovered && hoverImage ? "opacity-0" : "opacity-100"}`}
            sizes="33vw"
          />
          {hoverImage && (
            <Image
              src={hoverImage}
              alt={product.name}
              fill
              className={`object-cover object-center absolute inset-0 scale-105 transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"}`}
              sizes="33vw"
            />
          )}
          <ProductBadge badge={product.badge} className="absolute right-3 top-3 z-10" />
        </div>
      </Link>

      <div className="mt-2.5 sm:mt-4">
        <div className="scale-90 origin-left sm:scale-100"><Stars count={product.badge === "best seller" ? 5 : 4} /></div>
        <p className="mt-1 sm:mt-1.5 text-[12.5px] sm:text-[15px] font-semibold text-gray-900 leading-snug line-clamp-1 transition-colors group-hover:text-[#5f3d4e]">{product.name}</p>
        {product.tagline && (
          <p className="hidden sm:block text-[13px] text-[#4d9ab5]">{product.tagline}</p>
        )}
        {product.description && (
          <p className="hidden sm:block mt-2 text-[12px] leading-5 text-gray-500 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-1 sm:mt-2 flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-[13px] sm:text-[15px] font-bold bg-gradient-to-r from-[#5f3d4e] to-[#4d9ab5] bg-clip-text text-transparent">PKR {product.price}</span>
          {hasDiscount && (
            <>
              <span className="text-[11px] sm:text-[13px] text-black line-through">PKR {product.compareAtPrice}</span>
              <span className="inline-block bg-red-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 leading-none">
                {discountPct}% OFF
              </span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={handleAddToCart}
        className={`mt-2.5 sm:mt-3 w-full flex items-center justify-center gap-1.5 sm:gap-2 rounded-full py-2 sm:py-2.5 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-semibold transition-all duration-300 active:scale-[0.97] ${
          added
            ? "bg-rose-400 text-white"
            : "bg-gray-900 text-white hover:bg-gray-700"
        }`}
      >
        {added
          ? <><svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg><span className="hidden sm:inline">Added to Cart</span><span className="sm:hidden">Added</span></>
          : <><svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg><span className="hidden sm:inline">Add to Cart</span><span className="sm:hidden">Add</span></>
        }
      </button>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] rounded-2xl bg-gray-200" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-14 rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/3 rounded bg-gray-200" />
      </div>
      <div className="mt-3 h-10 rounded-full bg-gray-200" />
    </div>
  );
}

export default function SkincarePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  // fetchWithRetry (not a bare fetch) — mobile/in-app-browser connections
  // intermittently drop mid-request (see lib/fetchRetry.ts). A bare fetch
  // has no timeout at all, so a stalled connection just hangs forever with
  // neither .then nor .catch ever firing — the customer is left staring at
  // an empty page indefinitely, with no error and no way to recover. This
  // is what a real customer's Clarity session recording showed: page loaded,
  // product grid never did, session just sat there until they gave up.
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setLoadError(false);

    fetchWithRetry("/api/products?category=serums", { timeoutMs: 10000, retries: 2 })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setLoaded(true);
      });

    return () => { cancelled = true; };
  }, [retryTick]);

  // Auto-scroll straight to the products on every visit, so shoppers land on
  // the collection instead of having to scroll past the hero themselves.
  // Manually computed scrollTo (not scrollIntoView) fired after a settle
  // delay + double rAF — the same reliable technique used on the product
  // detail page; a bare scrollIntoView on a fixed timer was getting
  // silently overridden by the browser's own scroll handling around
  // navigation/hydration.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const scrollToSerums = () => {
      if (cancelled) return;
      const el = document.getElementById("serums");
      if (!el) return;
      const OFFSET = 160; // clears the fixed navbar + announcement bar
      const top = el.getBoundingClientRect().top + window.scrollY - OFFSET;
      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    };

    const t = setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(scrollToSerums));
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  return (
    <main className="bg-[#f1efef]">
      <Navbar />

      {/* Category hero banner */}
      <div className="relative mt-[124px] h-[38vh] sm:h-[42vh] min-h-[260px] sm:min-h-[280px] w-full overflow-hidden">
        <Image
          src="/off2.webp"
          alt="amneh skincare"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
        <div className="absolute top-[132px] left-6 z-[60] sm:left-10 lg:left-16">
          <BackButton light />
        </div>
        <div className="relative z-10 flex h-full items-end px-6 pb-8 sm:px-10 sm:pb-10 lg:px-16">
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-white/70 mb-2">
              collection
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white">
              Skincare
            </h1>
          </div>
        </div>
      </div>

      {/* Sub-category nav */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-screen-xl items-center gap-6 sm:gap-8 overflow-x-auto scrollbar-hide px-6 sm:px-8 py-3.5 sm:py-4">
          {categories.map((cat) => (
            <a
              key={cat}
              href={`#${cat.replace(" ", "-")}`}
              className={`shrink-0 text-[12px] sm:text-[13px] uppercase tracking-wide transition ${
                cat === "serums"
                  ? "border-b-2 border-[#5f3d4e] pb-1 font-semibold text-[#5f3d4e]"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {cat}
            </a>
          ))}
        </div>
      </div>

      {/* Serums section */}
      <section
        id="serums"
        className="mx-auto max-w-screen-xl px-6 py-12 sm:py-16 lg:px-10 scroll-mt-[160px]"
      >
        <FadeUp delay={0} duration={600} distance={14}>
          <h2 className="mb-1 text-sm uppercase tracking-[0.3em] text-gray-400">
            amneh. skincare
          </h2>
        </FadeUp>

        <RevealText
          lines={["Serums"]}
          tag="h3"
          className="mb-4 text-2xl sm:text-3xl font-bold uppercase tracking-tight text-gray-900"
          delay={80}
        />

        <FadeUp delay={100} duration={500} distance={10}>
          <FreeShippingNote className="mb-8 sm:mb-10 w-fit mx-auto sm:mx-0" />
        </FadeUp>

        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-8">
          {!loaded && Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}
          {loaded && !loadError && products.map((p, i) => (
            <ScaleIn key={p.id} delay={i * 90} threshold={0.05}>
              <SkincareProductCard product={p} />
            </ScaleIn>
          ))}
          {loaded && loadError && (
            <div className="col-span-full flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-sm text-gray-500">
                Couldn&apos;t load products — check your connection and try again.
              </p>
              <button
                onClick={() => setRetryTick((t) => t + 1)}
                className="rounded-full bg-gray-900 px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-white hover:bg-gray-700 transition"
              >
                Retry
              </button>
            </div>
          )}
          {loaded && !loadError && products.length === 0 && (
            <p className="col-span-full text-center text-gray-300 py-16 text-sm">
              No products found in this collection yet.
            </p>
          )}
        </div>
      </section>

      {/* Banner */}
      <div className="relative h-[42vh] sm:h-[50vh] min-h-[300px] sm:min-h-[340px] w-full overflow-hidden">
        <div className="absolute inset-0 block sm:hidden">
          <Image
            src="/r10.png"
            alt="amneh serums mobile"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 hidden sm:block">
          <Image
            src="/f3.png"
            alt="amneh serums"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />
        <div className="relative z-10 flex h-full items-center px-6 sm:px-12 lg:px-20">
          <div className="max-w-xs text-white">
            <RevealText
              lines={["The Full", "Routine"]}
              tag="h2"
              className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white"
              delay={0}
              stagger={130}
            />
            <FadeUp delay={300} duration={700}>
              <p className="mt-3 sm:mt-4 text-sm leading-6 sm:leading-7 text-white/80">
                Discover our powerful serums, expertly formulated to hydrate,
                brighten, and reveal your skin’s natural glow
              </p>
            </FadeUp>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
