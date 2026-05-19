"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

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

function Stars() {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className="h-3 w-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function CartIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);

  const primaryImage = product.images[0]?.url ?? "/shot1.png";
  const hoverImage = product.images[1]?.url ?? null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ id: product.id, name: product.name, price: product.price, image: primaryImage });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      className="group block w-full text-left"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image — click goes to product page */}
      <Link href={`/products/${product.id}`} className="block">
      <div className="relative overflow-hidden bg-[#dff0f8] aspect-square">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          className={`object-contain object-center transition-opacity duration-500 ${hovered && hoverImage ? "opacity-0" : "opacity-100"}`}
          sizes="25vw"
        />
        {hoverImage && (
          <Image
            src={hoverImage}
            alt={product.name}
            fill
            className={`object-cover object-center transition-opacity duration-500 absolute inset-0 ${hovered ? "opacity-100" : "opacity-0"}`}
            sizes="25vw"
          />
        )}
        <span className="absolute left-3 top-3 text-xs text-gray-700 z-10">{product.shades}</span>
        <span className="absolute right-3 top-3 bg-white px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-700 z-10">
          {product.badge}
        </span>
      </div>
      </Link>

      {/* Info */}
      <div className="mt-3 px-0.5">
        <Stars />
        <div className="mt-1.5 flex items-start justify-between">
          <div>
            <p className="text-[13px] font-medium text-gray-900">{product.name}</p>
            <p className="text-[12px] text-gray-500">{product.type}</p>
          </div>
          <span className="text-[13px] text-gray-900">${product.price}</span>
        </div>
      </div>

      {/* Add to cart button — always visible */}
      <button
        onClick={handleAddToCart}
        className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 text-[11px] uppercase tracking-[0.2em] font-medium border transition-all duration-300 ${
          added
            ? "bg-rose-400 border-rose-400 text-white"
            : "bg-white border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white"
        }`}
      >
        {added ? <CheckIcon /> : <CartIcon />}
        {added ? "Added to bag" : "Add to bag"}
      </button>
    </div>
  );
}
