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
import Testimonials from "@/components/Testimonials";
import BackgroundVideo from "@/components/BackgroundVideo";
import ReviewSideTab from "@/components/ReviewSideTab";
import dynamic from "next/dynamic";
import type { Review } from "@/components/ReviewsModal";
import AddReviewModal from "@/components/AddReviewModal";

const ReviewsModal = dynamic(() => import("@/components/ReviewsModal"), { ssr: false });
import { RevealText, FadeUp, ScaleIn } from "@/components/ui/Reveal";
import { fetchWithRetry } from "@/lib/fetchRetry";
import { SKINCARE_HERO_VIDEO } from "@/lib/testimonials";
import { usePageDiagnostics } from "@/hooks/usePageDiagnostics";
import { diagEvent, diagTag } from "@/lib/diag";

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

function SkincareProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
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
            {images.map((img, idx) => (
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
                  // Only the first (visible) image of a prioritized card loads
                  // eagerly; the rest of the carousel stays lazy.
                  priority={priority && idx === 0}
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
            priority={priority}
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
        {/* No star row — it used to show a rating derived from the product
            badge (best seller → 5, else 4), i.e. fabricated social proof.
            Real per-product ratings can return once reviews are linked to
            products. */}
        <p className="text-[12.5px] sm:text-[15px] font-semibold text-gray-900 leading-snug line-clamp-1 transition-colors group-hover:text-[#5f3d4e]">{product.name}</p>
        {product.tagline && (
          <p className="hidden sm:block text-[13px] text-[#4d9ab5]">{product.tagline}</p>
        )}
        {product.description && (
          <p className="hidden sm:block mt-2 text-[12px] leading-5 text-gray-500 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-1 sm:mt-2 flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-[13px] sm:text-[15px] font-bold text-black">PKR {product.price}</span>
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

export default function SkincareClient({
  initialProducts = [],
}: {
  // Server-fetched products from app/skincare/page.tsx — baked into the SSR HTML
  // so the grid shows on first paint even in a Facebook/Instagram in-app browser
  // that stalls JS. The client fetch below becomes a fallback for the rare case
  // the server couldn't supply any.
  initialProducts?: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loaded, setLoaded] = useState(initialProducts.length > 0);
  const [loadError, setLoadError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [addReviewOpen, setAddReviewOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  const loadReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      const formattedReviews = data.map((r: any) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        text: r.text,
        date: new Date(r.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      }));
      setReviews(formattedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // Diagnostics: proves hydration ran, captures env/connection/fonts, and
  // audits whether media actually painted. Also tag how the products arrived
  // (baked into SSR HTML vs. needing the client fallback fetch) — an empty grid
  // is a top suspect for the "greyed out" look.
  usePageDiagnostics("skincare");
  useEffect(() => {
    diagTag("products_source", initialProducts.length > 0 ? "ssr" : "client-fetch");
    diagTag("products_count_initial", initialProducts.length);
    if (initialProducts.length === 0) diagEvent("diag_skincare_no_ssr_products");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Banner mobile/desktop choice is done with CSS breakpoints in the JSX below
  // (so mobile shows the video from first paint, no desktop-banner flash), and
  // the video only downloads on mobile because its wrapper is display:none on
  // desktop — see the banner comment. No JS viewport state needed.

  // fetchWithRetry (not a bare fetch) — mobile/in-app-browser connections
  // intermittently drop mid-request (see lib/fetchRetry.ts). A bare fetch
  // has no timeout at all, so a stalled connection just hangs forever with
  // neither .then nor .catch ever firing — the customer is left staring at
  // an empty page indefinitely, with no error and no way to recover. This
  // is what a real customer's Clarity session recording showed: page loaded,
  // product grid never did, session just sat there until they gave up.
  useEffect(() => {
    // Products already server-rendered into the HTML — skip the redundant
    // client fetch (this is the normal path now). Only fetch as a fallback when
    // the server supplied none.
    if (initialProducts.length > 0) return;
    let cancelled = false;
    setLoaded(false);
    setLoadError(false);

    // Diagnostics: time and tag the fallback fetch — this only runs when SSR
    // supplied no products, i.e. the exact path most likely to leave a blank/
    // skeleton grid if the connection is flaky.
    diagEvent("diag_skincare_client_fetch_start");
    const fetchStart = (() => { try { return performance.now(); } catch { return 0; } })();

    fetchWithRetry("/api/products?category=serums", { timeoutMs: 10000, retries: 2 })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
        setLoaded(true);
        try { diagTag("products_fetch_ms", Math.round(performance.now() - fetchStart)); } catch {}
        diagTag("products_count_fetched", Array.isArray(data) ? data.length : "not-array");
        diagEvent("diag_skincare_client_fetch_ok");
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setLoaded(true);
        try { diagTag("products_fetch_ms", Math.round(performance.now() - fetchStart)); } catch {}
        diagTag("products_fetch_result", "error");
        diagEvent("diag_skincare_client_fetch_fail");
      });

    return () => { cancelled = true; };
  }, [retryTick, initialProducts.length]);

  // Auto-scroll straight to the products on every visit, so shoppers land on
  // the collection instead of having to scroll past the hero themselves.
  // Manually computed scrollTo (not scrollIntoView) fired after a settle
  // delay + double rAF — the same reliable technique used on the product
  // detail page; a bare scrollIntoView on a fixed timer was getting
  // silently overridden by the browser's own scroll handling around
  // navigation/hydration.
  //
  // YIELDS TO THE USER: any touch/scroll/keypress before the timer fires
  // cancels the auto-scroll permanently — a visitor who has already started
  // reading or scrolling must never have the page yanked out from under
  // them (scroll hijacking reads as broken, and interrupted smooth-scrolls
  // are what originally triggered the invisible-content bug here).
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const cancelOnInteraction = () => { cancelled = true; };
    const INTERACTION_EVENTS: (keyof WindowEventMap)[] = ["touchstart", "wheel", "keydown"];
    INTERACTION_EVENTS.forEach((ev) =>
      window.addEventListener(ev, cancelOnInteraction, { passive: true, once: true })
    );

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
      INTERACTION_EVENTS.forEach((ev) => window.removeEventListener(ev, cancelOnInteraction));
    };
  }, []);

  return (
    <main className="bg-[#f1efef]">
      <Navbar />
      <ReviewSideTab onClick={() => setReviewsOpen(true)} />
      <ReviewsModal
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        onAddReview={() => setAddReviewOpen(true)}
        reviews={reviews}
      />
      <AddReviewModal
        open={addReviewOpen}
        onClose={() => setAddReviewOpen(false)}
        onSuccess={() => loadReviews()}
      />

      {/* Category hero banner — UGC video on MOBILE (vertical reels fit a
          tall phone screen); static wide banner on DESKTOP (where a cropped
          vertical reel would look bad). Video only mounts on mobile, so
          desktop never downloads it. */}
      <div className="relative mt-[124px] h-[38vh] sm:h-[42vh] min-h-[260px] sm:min-h-[280px] w-full overflow-hidden">
        {/* MOBILE: UGC video. Which of the two shows is decided by a CSS
            breakpoint (lg:hidden / hidden lg:block), NOT by JS — so on a phone
            the video area is shown from the very FIRST paint and the desktop
            banner never flashes for a moment before swapping. The video also
            only DOWNLOADS on mobile: on desktop this wrapper is display:none,
            so BackgroundVideo's IntersectionObserver never sees it intersect
            and never fetches the file. On mobile the banner is above the fold,
            so the observer fires immediately and it loads right away (no
            `eager` needed). */}
        {SKINCARE_HERO_VIDEO && (
          <div className="absolute inset-0 lg:hidden">
            <BackgroundVideo
              video={SKINCARE_HERO_VIDEO}
              diagLabel="skincare-hero"
              loadDelayMs={1200}
            />
          </div>
        )}
        {/* DESKTOP: static wide banner. Shown on ALL breakpoints if no video. */}
        <div className={`absolute inset-0 ${SKINCARE_HERO_VIDEO ? "hidden lg:block" : ""}`}>
          <Image
            src="/off2.webp"
            alt="amneh skincare"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        </div>
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
              {/* First row (2 cols on mobile) gets priority so the products the
                  auto-scroll lands on paint first, ahead of below-fold media. */}
              <SkincareProductCard product={p} priority={i < 2} />
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

      {/* Reviews + UGC videos — above the routine banner so social proof
          comes right after the products, while the visitor is still deciding. */}
      <Testimonials />

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
