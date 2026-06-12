"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useCart } from "@/context/CartContext";

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

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);

  const images = product.images.length
    ? product.images
    : [{ id: "fallback", url: "/shot1.png", sortOrder: 0 }];
  const primaryImage = images[0].url;
  const imgCount = images.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Autoplay removed — manual navigation only

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    <div
      className="group w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image carousel */}
      <Link
        href={`/products/${product.id}`}
        className="block relative overflow-hidden bg-white aspect-[3/4]"
        aria-label={`${product.name} product link`}
      >
        <div
          ref={wrapperRef}
          className="relative h-full w-full"
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={`${product.name} images`}
        >
          <div
            className="flex h-full w-full transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {images.map((img) => (
              <div key={img.id} className="relative w-full flex-shrink-0">
                <Image
                  src={img.url}
                  alt={product.name}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 1024px) 72vw, 25vw"
                />
              </div>
            ))}
          </div>

          {/* Badge */}
          <span className="absolute right-2.5 top-2.5 bg-white px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-700">
            {product.badge}
          </span>

          {/* Dots */}
          {imgCount > 1 && (
            <div className="absolute left-1/2 bottom-3 z-20 flex -translate-x-1/2 items-center gap-2">
              {images.map((_, i) => (
                <button
                  key={`dot-${i}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveIndex(i);
                  }}
                  aria-label={`Show image ${i + 1} of ${imgCount}`}
                  aria-current={i === activeIndex}
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${i === activeIndex ? "bg-gray-900 scale-110" : "bg-gray-300"}`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Info row */}
      <div className="mt-3 flex items-center justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-gray-900 leading-tight truncate">
            {product.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[13px] font-semibold text-gray-900">
              PKR {product.price}
            </span>
            <span className="text-[11px] text-gray-400">{product.type}</span>
          </div>
        </div>

        {/* Cart button */}
        <button
          onClick={handleAddToCart}
          aria-label="Add to bag"
          className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full border transition-all duration-200 ${
            added
              ? "bg-[#4d9ab5] border-[#4d9ab5] text-white"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-900 hover:border-gray-900 hover:text-white"
          }`}
        >
          {added ? (
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
