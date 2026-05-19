"use client";

import { useState, useEffect } from "react";
import ProductCard from "./ProductCard";

interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

interface Product {
  id: string;
  name: string;
  type: string;
  price: number;
  shades: string;
  badge: string;
  images: ProductImage[];
}

export default function ProductCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [start, setStart] = useState(0);
  const perPage = 4;

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => {});
  }, []);

  const visible = products.slice(start, start + perPage);

  return (
    <section id="products" className="bg-[#f0f8fc] py-14" style={{ scrollMarginTop: "60px" }}>

      {/* ── Mobile: horizontal snap scroll ── */}
      <div
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 pb-3 [&::-webkit-scrollbar]:hidden lg:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {products.length === 0 ? (
          <p className="py-16 text-center text-gray-300 text-sm w-full">Loading…</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="min-w-[72%] sm:min-w-[44%] flex-shrink-0 snap-start">
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
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          className="grid gap-5 justify-center"
          style={{ gridTemplateColumns: `repeat(${Math.min(visible.length || 1, 4)}, minmax(0, 280px))` }}
        >
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {visible.length === 0 && (
            <div className="py-16 text-center text-gray-300 text-sm">Loading products…</div>
          )}
        </div>

        <button
          onClick={() => setStart((s) => Math.min(products.length - perPage, s + 1))}
          disabled={start >= products.length - perPage}
          className="absolute -right-3 top-[45%] z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm disabled:opacity-25 hover:bg-gray-50 transition"
          aria-label="Next"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Scroll hint dots — mobile only */}
      {products.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4 lg:hidden">
          {products.map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-gray-300"
            />
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-center px-6">
        <a
          href="/skincare#serums"
          className="border border-gray-900 px-10 py-3 text-xs uppercase tracking-[0.22em] text-gray-900 hover:bg-gray-900 hover:text-white transition duration-300"
        >
          shop now
        </a>
      </div>
    </section>
  );
}
