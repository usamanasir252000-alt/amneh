"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import BackButton from "@/components/BackButton";

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
  tagline: string | null;
  description: string | null;
  category: string;
  images: ProductImage[];
}

function Stars({ count = 4 }: { count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
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
      <span className="text-[12px] text-gray-400">(128 reviews)</span>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((p) => {
        setProduct(p);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const image = product.images[0]?.url ?? "";
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f1efef]">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f1efef]">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-gray-400 text-sm">Product not found.</p>
          <Link
            href="/"
            className="text-xs uppercase tracking-widest border border-gray-900 px-6 py-2.5 hover:bg-gray-900 hover:text-white transition"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const images = product.images;
  const currentImage = images[activeImage]?.url ?? "/shot1.png";

  return (
    <main className="min-h-screen bg-[#f1efef]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 pt-28 pb-4">
        <div className="mb-4">
          <BackButton />
        </div>
        <nav className="flex items-center gap-2 text-[11px] text-gray-400 uppercase tracking-widest">
          <Link href="/" className="hover:text-gray-700 transition">
            Home
          </Link>
          <span>/</span>
          <Link
            href={product.category === "skincare" ? "/skincare" : "/"}
            className="hover:text-gray-700 transition capitalize"
          >
            {product.category === "all" ? "Shop" : product.category}
          </Link>
          <span>/</span>
          <span className="text-gray-600">{product.name}</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: Image gallery */}
          <div className="flex gap-4">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex flex-col gap-2.5 w-16 flex-shrink-0">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-16 h-16 bg-[#dff0f8] overflow-hidden border-2 transition-all duration-200 ${
                      activeImage === i
                        ? "border-gray-900"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      className={
                        i === 0 ? "object-contain p-1" : "object-cover"
                      }
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 bg-[#dff0f8] overflow-hidden relative group">
              {/* Image 1 — always rendered, sets the container height */}
              <Image
                src={images[0]?.url ?? "/shot1.png"}
                alt={product.name}
                width={0}
                height={0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                style={{
                  width: "100%",
                  height: "auto",
                  visibility: activeImage === 0 ? "visible" : "hidden",
                }}
                className="transition-transform duration-500 ease-out group-hover:scale-105"
                priority
              />
              {/* Image 2+ — absolutely fills the same space */}
              {images.slice(1).map((img, i) => (
                <Image
                  key={img.id}
                  src={img.url}
                  alt={product.name}
                  fill
                  className={`object-cover transition-all duration-500 ease-out group-hover:scale-105 ${activeImage === i + 1 ? "opacity-100" : "opacity-0"}`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ))}
              {/* Badge */}
              <span className="absolute top-4 left-4 bg-white px-3 py-1 text-[10px] uppercase tracking-widest text-gray-700 shadow-sm z-10">
                {product.badge}
              </span>
            </div>
          </div>

          {/* Right: Product info */}
          <div className="flex flex-col">
            {/* Category tag */}
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#4d9ab5] mb-3">
              {product.type}
            </p>

            {/* Name */}
            <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight text-gray-900 leading-tight mb-3">
              {product.name}
            </h1>

            {/* Stars */}
            <div className="mb-4">
              <Stars count={product.badge === "best seller" ? 5 : 4} />
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-2xl font-semibold text-gray-900">
                PKR {product.price}
              </span>
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                {product.shades}
              </span>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gray-100 mb-5" />

            {/* Tagline / Description */}
            {product.tagline && (
              <p className="text-sm font-medium text-gray-700 mb-2">
                {product.tagline}
              </p>
            )}
            {product.description && (
              <p className="text-sm leading-7 text-gray-500 mb-6">
                {product.description}
              </p>
            )}
            {!product.tagline && !product.description && (
              <p className="text-sm leading-7 text-gray-500 mb-6">
                A luxurious formula crafted for radiant, healthy-looking skin.
                Part of the amneh. signature collection.
              </p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-5">
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Qty
              </p>
              <div className="flex items-center border border-gray-200">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition text-lg"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm text-gray-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to bag */}
            <button
              onClick={handleAddToCart}
              className={`w-full flex items-center justify-center gap-3 py-4 text-sm uppercase tracking-[0.25em] font-medium transition-all duration-300 ${
                added
                  ? "bg-rose-400 text-white"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
            >
              {added ? (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Added to Bag
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
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
                  Add to Bag
                </>
              )}
            </button>

            {/* Wishlist */}
            <button className="w-full flex items-center justify-center gap-2 py-3.5 mt-3 text-xs uppercase tracking-widest text-gray-500 border border-gray-200 hover:border-gray-400 transition">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              Save to Wishlist
            </button>

            {/* Divider */}
            <div className="w-full h-px bg-gray-100 mt-6 mb-5" />

            {/* Feature strips */}
            <div className="space-y-3">
              {[
                {
                  icon: "M5 13l4 4L19 7",
                  label: "Free shipping on orders over $50",
                },
                {
                  icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
                  label: "Free returns within 30 days",
                },
                {
                  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                  label: "Dermatologist tested & approved",
                },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#d6ecf7] flex items-center justify-center flex-shrink-0">
                    <svg
                      className="h-3.5 w-3.5 text-[#4d9ab5]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={f.icon}
                      />
                    </svg>
                  </div>
                  <span className="text-[12px] text-gray-500">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-20" />
      <Footer />
    </main>
  );
}
