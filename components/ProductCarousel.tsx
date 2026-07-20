"use client";

import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
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
  shades: string;
  badge: string;
  images: ProductImage[];
}

export default function ProductCarousel({
  initialProducts = [],
}: {
  // Server-fetched products passed in from the page (server component). When
  // present they're baked into the SSR HTML, so the carousel shows real
  // products on first paint — even inside a Facebook/Instagram in-app browser
  // that stalls or never runs JS. Falls back to the client fetch below only
  // when the server couldn't provide any (e.g. server fetch errored).
  initialProducts?: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loadError, setLoadError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [start, setStart] = useState(0);
  const perPage = 4;

  // Client fetch is now only a FALLBACK for when the server didn't supply
  // products (initialProducts empty). Normally products arrive as props and are
  // already in the HTML, so this effect no-ops — no redundant round-trip, and
  // the "Loading…" state is never shown to a normal visitor.
  //
  // fetchWithRetry (not a bare fetch) — mobile/in-app-browser connections
  // intermittently drop mid-request (see lib/fetchRetry.ts).
  useEffect(() => {
    if (initialProducts.length > 0) return;
    let cancelled = false;
    setLoadError(false);

    fetchWithRetry("/api/products", { timeoutMs: 10000, retries: 2 })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
      });

    return () => { cancelled = true; };
  }, [retryTick, initialProducts.length]);

  const visible = products.slice(start, start + perPage);

  return (
    <section
      id="products"
      className="py-16 bg-[#f1efef]"
      style={{ scrollMarginTop: "60px" }}
    >
      {/* Section header */}
      <div className="text-center mb-10 px-6">
        <FadeUp delay={0} duration={600} distance={14}>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 mb-3">curated for you</p>
        </FadeUp>
        <RevealText
          lines={['The Collection']}
          tag="h2"
          className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-gray-900"
          delay={80}
        />
        <FadeUp delay={200} duration={500} distance={10}>
          <div className="mx-auto mt-4 h-px w-12 bg-gray-300" />
        </FadeUp>
      </div>

      {/* ── Mobile: horizontal snap scroll ── */}
      <div
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 pb-3 [&::-webkit-scrollbar]:hidden lg:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {loadError ? (
          <div className="flex w-full flex-col items-center gap-4 py-16 text-center">
            <p className="text-sm text-gray-500">Couldn&apos;t load products — check your connection.</p>
            <button onClick={() => setRetryTick((t) => t + 1)} className="rounded-full bg-gray-900 px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-white hover:bg-gray-700 transition">
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <p className="py-16 text-center text-gray-300 text-sm w-full">
            Loading…
          </p>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="min-w-[72%] sm:min-w-[44%] flex-shrink-0 snap-start"
            >
              <ProductCard product={p} />
            </div>
          ))
        )}
      </div>

      {/* ── Desktop: paginated grid ── */}
      <div className="hidden lg:block relative mx-auto max-w-screen-xl px-6">
        <button
          onClick={() => setStart((s) => Math.max(0, s - 1))}
          disabled={start === 0}
          className="absolute -left-3 top-[45%] z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm disabled:opacity-25 hover:bg-gray-50 transition"
          aria-label="Previous"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div
          className="grid gap-5 justify-center"
          style={{
            gridTemplateColumns: `repeat(${Math.min(visible.length || 1, 4)}, minmax(0, 280px))`,
          }}
        >
          {visible.map((p, i) => (
            <ScaleIn key={p.id} delay={i * 80}>
              <ProductCard product={p} />
            </ScaleIn>
          ))}
          {visible.length === 0 && loadError && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-sm text-gray-500">Couldn&apos;t load products — check your connection.</p>
              <button onClick={() => setRetryTick((t) => t + 1)} className="rounded-full bg-gray-900 px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-white hover:bg-gray-700 transition">
                Retry
              </button>
            </div>
          )}
          {visible.length === 0 && !loadError && (
            <div className="py-16 text-center text-gray-300 text-sm">
              Loading products…
            </div>
          )}
        </div>

        <button
          onClick={() =>
            setStart((s) => Math.min(products.length - perPage, s + 1))
          }
          disabled={start >= products.length - perPage}
          className="absolute -right-3 top-[45%] z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm disabled:opacity-25 hover:bg-gray-50 transition"
          aria-label="Next"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Scroll hint dots — mobile only */}
      {products.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4 lg:hidden">
          {products.map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          ))}
        </div>
      )}

      <FadeUp delay={0} duration={600} className="mt-10 flex justify-center px-6">
        <a
          href="/skincare#serums"
          className="border border-gray-900 px-10 py-3 text-xs uppercase tracking-[0.22em] text-gray-900 hover:bg-gray-900 hover:text-white transition duration-300"
        >
          shop now
        </a>
      </FadeUp>
    </section>
  );
}
