"use client";

import Image from "next/image";
import { useState } from "react";
import ProductQuickAdd from "./ProductQuickAdd";

const products = [
  {
    id: 1,
    image: "/shot1.png",
    name: "blush glow",
    type: "hydrating serum",
    shades: "+3 shades",
    badge: "new",
    price: 38,
  },
  {
    id: 2,
    image: "/shot2.png",
    name: "petal tint",
    type: "velvet lip butter",
    shades: "+5 shades",
    badge: "new",
    price: 28,
  },
  {
    id: 3,
    image: "/shot3.png",
    name: "rose bloom",
    type: "radiance oil",
    shades: "+2 shades",
    badge: "best seller",
    price: 42,
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className="h-3 w-3 text-gray-300"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductCarousel() {
  const [start, setStart] = useState(0);
  const perPage = 4;

  return (
    <section className="bg-[#faf5f6] py-14 px-6">
      <div className="relative mx-auto max-w-screen-xl">
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

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.slice(start, start + perPage).map((p) => (
            <ProductQuickAdd
              key={p.id}
              id={String(p.id)}
              name={p.name}
              price={p.price}
              image={p.image}
              className="group cursor-pointer block w-full"
            >
              <div className="relative overflow-hidden bg-[#eeebe8] aspect-square">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-contain object-center transition duration-500 group-hover:scale-105"
                  sizes="25vw"
                />
                <span className="absolute left-3 top-3 text-xs text-gray-700">
                  {p.shades}
                </span>
                <span className="absolute right-3 top-3 bg-white px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-700">
                  {p.badge}
                </span>
              </div>
              <div className="mt-3 px-0.5">
                <Stars />
                <div className="mt-1.5 flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-gray-900">
                      {p.name}
                    </p>
                    <p className="text-[12px] text-gray-500">{p.type}</p>
                  </div>
                  <span className="text-[13px] text-gray-900">${p.price}</span>
                </div>
              </div>
            </ProductQuickAdd>
          ))}
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

      <div className="mt-10 flex justify-center">
        <a
          href="#"
          className="border border-gray-900 px-10 py-3 text-xs uppercase tracking-[0.22em] text-gray-900 hover:bg-gray-900 hover:text-white transition duration-300"
        >
          shop now
        </a>
      </div>
    </section>
  );
}
