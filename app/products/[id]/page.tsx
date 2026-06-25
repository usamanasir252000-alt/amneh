"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { fbTrack } from "@/lib/fbpixel";
import Link from "next/link";
import BackButton from "@/components/BackButton";

interface ProductImage { id: string; url: string; sortOrder: number }
interface Product {
  id: string; handle: string; variantId: string; name: string;
  type: string; price: number; shades: string; badge: string;
  tagline: string | null; description: string | null; category: string;
  images: ProductImage[];
  compareAtPrice: number | null;
  ingredients: string | null; howToUse: string | null; benefits: string | null;
}

// ── Stars ──────────────────────────────────────────────────────────────────
function Stars({ count = 4 }: { count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <svg key={i} className={`h-3.5 w-3.5 ${i <= count ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-[12px] text-gray-400">(128 reviews)</span>
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────────────
function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="w-9 h-9 rounded-full bg-[#d6ecf7] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.35em] text-gray-900">{title}</h2>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ── Benefits grid ─────────────────────────────────────────────────────────
const BENEFIT_ICONS = [
  <svg key="b1" className="h-5 w-5 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>,
  <svg key="b2" className="h-5 w-5 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3s-6 7.5-6 11a6 6 0 0012 0c0-3.5-6-11-6-11z"/></svg>,
  <svg key="b3" className="h-5 w-5 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
  <svg key="b4" className="h-5 w-5 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>,
  <svg key="b5" className="h-5 w-5 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/></svg>,
];

function BenefitsGrid({ text }: { text: string }) {
  const items = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      // Strip leading numbering: "1)", "1.", "1 -" etc.
      const stripped = line.replace(/^\d+[\.\)\-\s]+/, "").trim();
      // Try to split "Ingredient name verb rest..." into title + desc
      // Split on first connecting verb: which, that, attracts, delivers, helps, boosts, reduces, improves
      const verbMatch = stripped.match(/^(.+?)\s+(which|that|attracts|delivers|deliver|helps|boosts|boost|reduces|reduce|improves|improve|calms|calm|rehydrates|loosens|soothe|soothes)\s+(.+)$/i);
      if (verbMatch) {
        return { title: verbMatch[1].trim(), desc: verbMatch[2] + " " + verbMatch[3] };
      }
      // Fallback: first 3 words as title
      const words = stripped.split(" ");
      if (words.length > 4) {
        return { title: words.slice(0, 2).join(" "), desc: words.slice(2).join(" ") };
      }
      return { title: null, desc: stripped };
    });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-[#d6ecf7] flex items-center justify-center">
              {BENEFIT_ICONS[i % BENEFIT_ICONS.length]}
            </div>
            <span className="text-5xl font-black text-gray-100 leading-none select-none">{i + 1}</span>
          </div>
          {item.title && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-900">{item.title}</p>
          )}
          <p className="text-sm text-gray-500 leading-6 capitalize">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ── Accordion (for shipping) ───────────────────────────────────────────────
function Accordion({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-gray-200">
      <button onClick={() => setOpen(o => !o)} className="flex items-center justify-between w-full py-5 text-left group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#d6ecf7] flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-[#c2e0f0]">
            {icon}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-gray-900">{title}</span>
        </div>
        <span className={`text-gray-400 transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="pb-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ── Rich text renderer ─────────────────────────────────────────────────────
function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-1" />;
        const numMatch = t.match(/^(\d+)\)(.*)/);
        if (numMatch) {
          return (
            <div key={i} className="flex gap-3 items-start">
              <span className="w-5 h-5 rounded-full bg-[#d6ecf7] text-[#4d9ab5] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {numMatch[1]}
              </span>
              <p className="text-sm leading-6 text-gray-500 flex-1">{bold(numMatch[2].trim())}</p>
            </div>
          );
        }
        return <p key={i} className="text-sm leading-7 text-gray-500">{bold(t)}</p>;
      })}
    </div>
  );
}

function bold(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((p, j) =>
    p.startsWith("*") && p.endsWith("*")
      ? <strong key={j} className="text-gray-800 font-semibold">{p.slice(1,-1)}</strong>
      : p
  );
}

// ── Ingredients cloud ──────────────────────────────────────────────────────
const KEY_INGS = ["hyaluronic acid","niacinamide","vitamin c","glycolic acid","salicylic","glutathione","vitamin b3","aloe","pineapple","vitamin b5","ascorbyl","lactic acid","retinol","strawberry"];

function IngredientsCloud({ text }: { text: string }) {
  const items = text.split(",").map(i => i.trim()).filter(Boolean);
  const hasKey = items.some(it => KEY_INGS.some(k => it.toLowerCase().includes(k)));
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {items.map((item, i) => {
          const isKey = KEY_INGS.some(k => item.toLowerCase().includes(k));
          return (
            <span key={i} className={`px-3 py-1.5 text-xs rounded-full border font-medium ${
              isKey ? "bg-[#d6ecf7] border-[#a8d5ea] text-[#2e7a99]" : "bg-white border-gray-200 text-gray-500"
            }`}>
              {item}
            </span>
          );
        })}
      </div>
      {hasKey && (
        <p className="text-[11px] text-[#4d9ab5] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4d9ab5] inline-block" />
          Blue = key active ingredients
        </p>
      )}
    </div>
  );
}

// ── How to Use steps ───────────────────────────────────────────────────────
const DEFAULT_STEPS = [
  { title: "Preparation", desc: "Initialize by ensuring your face is thoroughly cleansed and dried." },
  { title: "Activation",  desc: "Warm the serum within your fingertips to maximize its molecular performance." },
  { title: "Application", desc: "Massage delicately over face, neck and hands with upward strokes." },
  { title: "Completion",  desc: "Layer with your moisturizer." },
];

const STEP_ICONS = [
  <svg key="1" className="h-5 w-5 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3s-6 7.5-6 11a6 6 0 0012 0c0-3.5-6-11-6-11z"/></svg>,
  <svg key="2" className="h-5 w-5 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>,
  <svg key="3" className="h-5 w-5 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/></svg>,
  <svg key="4" className="h-5 w-5 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
];

function HowToUseSteps({ text }: { text: string | null }) {
  let steps = DEFAULT_STEPS;

  if (text) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      steps = lines.map(line => {
        const ci = line.indexOf(":");
        if (ci > 0 && ci < 40) {
          return {
            title: line.slice(0,ci).replace(/^\d+[\.\)\-\s]+/,"").trim(),
            desc:  line.slice(ci+1).trim(),
          };
        }
        return { title: "", desc: line.replace(/^\d+[\.\)\-\s]+/,"").trim() };
      });
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {steps.map((step, i) => (
        <div key={i} className="relative bg-white rounded-2xl p-6 shadow-sm border border-white/80 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-[#d6ecf7] flex items-center justify-center">
              {STEP_ICONS[i % STEP_ICONS.length]}
            </div>
            <span className="text-5xl font-black text-gray-100 leading-none select-none">{i+1}</span>
          </div>
          {step.title && <p className="text-[11px] font-bold uppercase tracking-widest text-gray-900">{step.title}</p>}
          <p className="text-sm text-gray-500 leading-6">{step.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();

  const [product, setProduct]     = useState<Product | null>(null);
  const [loading, setLoading]     = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity]   = useState(1);
  const [added, setAdded]         = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(p => { setProduct(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  // Meta Pixel: product view
  useEffect(() => {
    if (product) {
      fbTrack("ViewContent", {
        content_ids: [product.variantId],
        content_name: product.name,
        content_type: "product",
        value: product.price,
        currency: "PKR",
      });
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ variantId: product.variantId, name: product.name, price: product.price, image: product.images[0]?.url ?? "" });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleBuyNow = async () => {
    if (!product || buyingNow) return;
    setBuyingNow(true);
    // Buy Now skips the cart, so fire BOTH AddToCart and InitiateCheckout —
    // otherwise these (high-intent) shoppers would be missing from the
    // Add-to-Cart audience entirely.
    fbTrack("AddToCart", {
      content_ids: [product.variantId],
      content_name: product.name,
      content_type: "product",
      value: product.price * quantity,
      currency: "PKR",
    });
    fbTrack("InitiateCheckout", {
      content_ids: [product.variantId],
      value: product.price * quantity,
      currency: "PKR",
      num_items: quantity,
    });
    try {
      const res = await fetch("/api/buy-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: product.variantId, quantity }),
      });
      const { checkoutUrl } = await res.json();
      if (checkoutUrl) window.location.href = checkoutUrl;
    } catch { setBuyingNow(false); }
  };

  if (loading) return (
    <main className="min-h-screen bg-[#f1efef]"><Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    </main>
  );

  if (!product) return (
    <main className="min-h-screen bg-[#f1efef]"><Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-400 text-sm">Product not found.</p>
        <Link href="/" className="text-xs uppercase tracking-widest border border-gray-900 px-6 py-2.5 hover:bg-gray-900 hover:text-white transition">Back to Home</Link>
      </div>
    </main>
  );

  const images = product.images;

  return (
    <main className="min-h-screen bg-[#f1efef]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 pt-28 pb-4">
        <div className="mb-4"><BackButton /></div>
        <nav className="flex items-center gap-2 text-[11px] text-gray-400 uppercase tracking-widest">
          <Link href="/" className="hover:text-gray-700 transition">Home</Link>
          <span>/</span>
          <Link href={product.category === "skincare" ? "/skincare" : "/"} className="hover:text-gray-700 transition capitalize">
            {product.category === "all" ? "Shop" : product.category}
          </Link>
          <span>/</span>
          <span className="text-gray-600">{product.name}</span>
        </nav>
      </div>

      {/* ── Main product grid ── */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

          {/* Images */}
          <div className="flex gap-4">
            {images.length > 1 && (
              <div className="flex flex-col gap-2.5 w-16 flex-shrink-0">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImage(i)}
                    className={`relative w-16 h-16 bg-[#dff0f8] overflow-hidden border-2 transition-all duration-200 ${activeImage === i ? "border-gray-900" : "border-transparent hover:border-gray-300"}`}>
                    <Image src={img.url} alt="" fill className={i===0?"object-contain p-1":"object-cover"} sizes="64px" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 bg-[#dff0f8] overflow-hidden relative group">
              <Image src={images[0]?.url ?? "/shot1.png"} alt={product.name}
                width={0} height={0} sizes="(max-width: 1024px) 100vw, 50vw"
                style={{ width:"100%", height:"auto", visibility: activeImage===0?"visible":"hidden" }}
                className="transition-transform duration-500 ease-out group-hover:scale-105" priority />
              {images.slice(1).map((img,i) => (
                <Image key={img.id} src={img.url} alt={product.name} fill
                  className={`object-cover transition-all duration-500 ease-out group-hover:scale-105 ${activeImage===i+1?"opacity-100":"opacity-0"}`}
                  sizes="(max-width: 1024px) 100vw, 50vw" />
              ))}
              <span className="absolute top-4 left-4 bg-white px-3 py-1 text-[10px] uppercase tracking-widest text-gray-700 shadow-sm z-10">{product.badge}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#4d9ab5] mb-3">{product.type}</p>
            <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-tight text-gray-900 leading-tight mb-3">{product.name}</h1>
            <div className="mb-5"><Stars count={product.badge==="best seller"?5:4} /></div>

            <div className="flex items-baseline gap-3 mb-5 flex-wrap">
              <span className="text-2xl font-semibold text-gray-900">PKR {product.price}</span>
              {product.compareAtPrice != null && product.compareAtPrice > product.price && (
                <>
                  <span className="text-lg text-gray-400 line-through">PKR {product.compareAtPrice}</span>
                  <span className="text-sm font-bold text-white bg-rose-400 px-2.5 py-1 rounded">
                    {Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF
                  </span>
                </>
              )}
              {product.shades && <span className="text-xs text-gray-400 uppercase tracking-wide">{product.shades}</span>}
            </div>

            <div className="w-full h-px bg-gray-200 mb-5" />

            {product.tagline && <p className="text-sm font-medium text-gray-700 mb-6">{product.tagline}</p>}

            {/* Qty */}
            <div className="flex items-center gap-4 mb-5">
              <p className="text-xs uppercase tracking-widest text-gray-500">Qty</p>
              <div className="flex items-center border border-gray-200">
                <button onClick={() => setQuantity(q => Math.max(1,q-1))} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition text-lg">−</button>
                <span className="w-10 text-center text-sm text-gray-900">{quantity}</span>
                <button onClick={() => setQuantity(q => q+1)} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition text-lg">+</button>
              </div>
            </div>

            {/* Add to Bag */}
            <button onClick={handleAddToCart}
              className={`w-full flex items-center justify-center gap-3 py-4 text-sm uppercase tracking-[0.25em] font-medium transition-all duration-300 ${added?"bg-rose-400 text-white":"bg-gray-900 text-white hover:bg-gray-700"}`}>
              {added
                ? <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Added to Bag</>
                : <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>Add to Bag</>
              }
            </button>

            {/* Buy Now */}
            <button onClick={handleBuyNow} disabled={buyingNow}
              className="w-full flex items-center justify-center gap-2 py-4 mt-3 text-sm uppercase tracking-[0.25em] font-medium bg-[#4d9ab5] text-white hover:bg-[#3a7a91] transition-colors disabled:opacity-60">
              {buyingNow
                ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>Buy Now</>
              }
            </button>

          </div>
        </div>
      </div>

      {/* ── Ingredients ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-14 border-t border-gray-200">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <SectionHeading
            title="Ingredients"
            icon={<svg className="h-4 w-4 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>}
          />
          {product.ingredients
            ? <IngredientsCloud text={product.ingredients} />
            : <p className="text-sm text-gray-400 italic">Ingredients list coming soon.</p>
          }
        </div>
      </section>

      {/* ── How to Use ──────────────────────────────────────────────────────── */}
      <section className="bg-[#e8f4fa] py-14">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
          <SectionHeading
            title="How to Use"
            icon={<svg className="h-4 w-4 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>}
          />
          <HowToUseSteps text={product.howToUse} />
        </div>
      </section>

      {/* ── Key Benefits ─────────────────────────────────────────────────────── */}
      {product.benefits && (
        <section className="bg-[#e8f4fa] py-14">
          <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
            <SectionHeading
              title="Key Benefits"
              icon={<svg className="h-4 w-4 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>}
            />
            <BenefitsGrid text={product.benefits} />
          </div>
        </section>
      )}

      {/* ── Shipping & Returns — accordion ──────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 pb-24">
        <Accordion
          title="Shipping & Returns"
          icon={<svg className="h-4 w-4 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { icon:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", title:"Delivery Time", desc:"3 to 5 business days across Pakistan" },
              { icon:"M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z", title:"Shipping Cost", desc:"PKR 200 flat · Free on orders over PKR 3,000" },
              { icon:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", title:"Returns", desc:"7 days for unused, unopened products" },
            ].map(item => (
              <div key={item.title} className="bg-[#f7fbfd] rounded-2xl p-6 border border-[#d6ecf7] flex flex-col gap-4">
                <div className="w-10 h-10 rounded-full bg-[#d6ecf7] flex items-center justify-center">
                  <svg className="h-5 w-5 text-[#4d9ab5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-900 mb-1.5">{item.title}</p>
                  <p className="text-sm text-gray-500 leading-6">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Full details in our{" "}
            <Link href="/returns" className="underline text-gray-600 hover:text-gray-900 transition">Return Policy</Link>{" "}
            and{" "}
            <Link href="/shipping" className="underline text-gray-600 hover:text-gray-900 transition">Shipping Policy</Link>.
          </p>
        </Accordion>
      </div>

      <Footer />
    </main>
  );
}
