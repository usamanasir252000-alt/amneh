"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { fbTrack } from "@/lib/fbpixel";
import { fetchWithRetry } from "@/lib/fetchRetry";
import { logEvent } from "@/lib/clientLog";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import type { ShopifyProduct } from "@/lib/shopify";

type Product = ShopifyProduct;

// ── Ingredient spotlight images ─────────────────────────────────────────────
// Sourced per-product from Shopify: Admin → Products → (a product) → Metafields
// → "spotlight_images" (namespace "custom", type "Multi-line text"). One image
// per line, format:
//   https://cdn.shopify.com/...jpg | Title | Description text goes here
// Title and description are both optional ("url" alone, or "url | Title",
// both work). Upload the photo itself in Admin → Content → Files first, then
// copy its URL into the line. Section auto-hides when the field is empty.
interface SpotlightImage { url: string; title: string; description: string }

function parseSpotlightImages(raw: string | null): SpotlightImage[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const firstPipe = line.indexOf("|");
      if (firstPipe === -1) return { url: line.trim(), title: "", description: "" };
      const url = line.slice(0, firstPipe).trim();
      const rest = line.slice(firstPipe + 1);
      const secondPipe = rest.indexOf("|");
      if (secondPipe === -1) return { url, title: rest.trim(), description: "" };
      return { url, title: rest.slice(0, secondPipe).trim(), description: rest.slice(secondPipe + 1).trim() };
    })
    .filter(item => item.url);
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
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5f3d4e] to-[#4d9ab5] flex items-center justify-center flex-shrink-0 shadow-sm">
        {icon}
      </div>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.35em] text-gray-900">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
    </div>
  );
}

// ── Benefits grid ─────────────────────────────────────────────────────────
const BENEFIT_ICONS = [
  <svg key="b1" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>,
  <svg key="b2" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3s-6 7.5-6 11a6 6 0 0012 0c0-3.5-6-11-6-11z"/></svg>,
  <svg key="b3" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
  <svg key="b4" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>,
  <svg key="b5" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/></svg>,
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
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className="group bg-white rounded-2xl p-6 border border-gray-100 flex flex-col gap-4 transition-all duration-300 hover:border-[#4d9ab5]/40 hover:shadow-[0_16px_40px_rgba(95,61,78,0.08)] hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#5f3d4e] to-[#4d9ab5] flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110">
              {BENEFIT_ICONS[i % BENEFIT_ICONS.length]}
            </div>
            <span className="text-5xl font-black text-gray-100 leading-none select-none">{i + 1}</span>
          </div>
          {item.title && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-900">{item.title}</p>
          )}
          <p className="text-sm text-gray-500 leading-6 capitalize">{item.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Accordion (for shipping) ───────────────────────────────────────────────
function Accordion({ title, icon, children, defaultOpen = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-200">
      <button onClick={() => setOpen(o => !o)} className="flex items-center justify-between w-full py-5 text-left group active:scale-[0.99] transition-transform">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#5f3d4e] to-[#4d9ab5] flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105">
            {icon}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.35em] text-gray-900">{title}</span>
        </div>
        <span className={`text-gray-400 transition-transform duration-300 ${open ? "rotate-45 text-[#5f3d4e]" : ""}`}>
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

// ── Patch Test — compact numbered card grid ────────────────────────────────
// Content is authored as "1) ... \n 2) ... \n *bold*" numbered lines. Each
// becomes a small card in a grid (2-up mobile, 4-up desktop) with a themed
// icon (apply → wait → observe → result) — same visual language as "How to
// Use" and "Key Benefits" below it, so the page reads as one system instead
// of three different step layouts, and stays compact instead of a tall list.
const PATCH_TEST_ICONS = [
  // droplet — apply
  <svg key="p1" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-3.5 4.5-6 7.86-6 11.25a6 6 0 0012 0c0-3.39-2.5-6.75-6-11.25z"/></svg>,
  // clock — wait
  <svg key="p2" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  // eye — observe
  <svg key="p3" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  // shield-check — result
  <svg key="p4" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.031 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
];

function PatchTestSteps({ text }: { text: string }) {
  const rawLines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const isStepped = rawLines.some(l => /^\d+\)/.test(l));

  // Not numbered lines — plain prose, fall back to the simple text renderer.
  if (!isStepped) return <FormattedText text={text} />;

  const steps = rawLines.map(line => {
    const numMatch = line.match(/^(\d+)\)(.*)/);
    return numMatch ? numMatch[2].trim() : line;
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {steps.map((desc, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="group relative bg-gradient-to-b from-white to-[#faf1f4] rounded-2xl p-4 sm:p-5 border border-[#f0dde3] flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(95,61,78,0.12)] active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#5f3d4e] to-[#4d9ab5] flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110">
              {PATCH_TEST_ICONS[i % PATCH_TEST_ICONS.length]}
            </div>
            <span className="text-3xl sm:text-4xl font-black text-gray-100 leading-none select-none">{i + 1}</span>
          </div>
          <p className="text-[11px] sm:text-sm text-gray-500 leading-5 sm:leading-6">{bold(desc)}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── When to use (Morning / Night / Morning & Night) ────────────────────────
function WhenToUse({ value }: { value: string }) {
  const lower = value.toLowerCase();
  const showSun = lower.includes("morning") || lower.includes("day");
  const showMoon = lower.includes("night") || lower.includes("evening");
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[#d6ecf7] bg-gradient-to-r from-[#f7fbfd] to-[#fbf5f7] px-5 py-3 shadow-sm">
      <span className="flex items-center gap-2 text-[#4d9ab5]">
        {showSun && (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>
        )}
        {showMoon && (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/></svg>
        )}
      </span>
      <span className="text-sm font-medium tracking-wide text-gray-800">{value}</span>
    </div>
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
            <span key={i} className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-transform duration-200 hover:-translate-y-0.5 ${
              isKey ? "bg-gradient-to-r from-[#d6ecf7] to-[#fbeef2] border-[#a8d5ea] text-[#2e7a99]" : "bg-white border-gray-200 text-gray-500"
            }`}>
              {item}
            </span>
          );
        })}
      </div>
      {hasKey && (
        <p className="text-[11px] text-[#4d9ab5] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#5f3d4e] to-[#4d9ab5] inline-block" />
          Blue = key active ingredients
        </p>
      )}
    </div>
  );
}

// ── Ingredient spotlight (real photos, sourced from a Shopify metafield) ───
// Big photo cards with an expandable title/description panel underneath —
// tap the +/− circle to reveal the description without leaving the grid.
function IngredientSpotlight({ images }: { images: SpotlightImage[] }) {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());
  if (images.length === 0) return null;

  const toggle = (i: number) => setOpenSet(prev => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
      {images.map((item, i) => {
        const open = openSet.has(i);
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="group rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-[#f0dde3]/70 shadow-[0_10px_28px_rgba(95,61,78,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(95,61,78,0.16)]"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image src={item.url} alt={item.title || "ingredient"} fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
            </div>
            {(item.title || item.description) && (
              <div className="bg-gradient-to-b from-white to-[#faf1f4] px-2.5 py-2.5 sm:px-4 sm:py-3.5 border-t border-[#f0dde3]">
                <button
                  onClick={() => toggle(i)}
                  disabled={!item.description}
                  className="flex w-full items-center justify-between gap-2 text-left active:scale-[0.98] transition-transform"
                >
                  <span className="text-[12px] sm:text-base font-semibold text-gray-900 leading-tight">{item.title}</span>
                  {item.description && (
                    <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-[#5f3d4e]/20 shadow-sm flex items-center justify-center text-[#5f3d4e]">
                      <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                        <path d="M2 8h12" />
                        <path d="M8 2v12" className={`transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`} />
                      </svg>
                    </span>
                  )}
                </button>
                {item.description && (
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? "grid-rows-[1fr] mt-2" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <p className="text-[11px] sm:text-sm text-gray-500 leading-5 sm:leading-6">{item.description}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Ingredients section ─────────────────────────────────────────────────────
// Spotlight photo cards up top (if the Shopify metafield has any), then a
// "View Full Ingredient List" toggle that reveals the ingredient list below —
// so the section leads with something visual instead of a dense list of
// chips. On a bundle product (bundleGroups present), the revealed list is a
// separate labeled block per included product instead of one merged cloud;
// everything else about the flow (spotlight → button → reveal) stays
// identical to a regular product.
function IngredientsSection({
  text, spotlightImages, bundleGroups,
}: {
  text: string;
  spotlightImages: SpotlightImage[];
  bundleGroups?: BundleIngredientGroup[];
}) {
  const [showList, setShowList] = useState(false);
  return (
    <>
      <IngredientSpotlight images={spotlightImages} />

      <div className={`flex justify-center ${spotlightImages.length > 0 ? "mt-8 sm:mt-10" : ""}`}>
        <button
          onClick={() => setShowList(v => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-[#5f3d4e]/25 bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-[#5f3d4e] shadow-sm transition-all duration-300 hover:bg-[#5f3d4e] hover:text-white hover:shadow-[0_10px_24px_rgba(95,61,78,0.2)] active:scale-95"
        >
          {showList ? "Hide Ingredient List" : "View Full Ingredient List"}
          <svg className={`h-3.5 w-3.5 transition-transform duration-300 ${showList ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className={`grid transition-[grid-template-rows] duration-400 ease-in-out ${showList ? "grid-rows-[1fr] mt-6" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          {bundleGroups && bundleGroups.length > 0
            ? <BundleIngredientsList groups={bundleGroups} />
            : <IngredientsCloud text={text} />
          }
        </div>
      </div>
    </>
  );
}

// ── Bundle ingredients — one list per product inside the bundle ────────────
// Sourced from a Shopify metafield on the bundle product itself: Admin →
// Products → (the bundle) → Metafields → "bundle_ingredients" (namespace
// "custom", type "Multi-line text"). One product per line, format:
//   Product Name | ingredient one, ingredient two, ingredient three
// Each line becomes its own labeled ingredient list below, instead of one
// merged list — so a shopper can see exactly what's in each item they're
// getting, not a jumbled combination.
interface BundleIngredientGroup { name: string; ingredients: string }

function parseBundleIngredients(raw: string | null): BundleIngredientGroup[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const pipeIdx = line.indexOf("|");
      if (pipeIdx === -1) return { name: "", ingredients: line };
      return { name: line.slice(0, pipeIdx).trim(), ingredients: line.slice(pipeIdx + 1).trim() };
    })
    .filter(g => g.ingredients);
}

function BundleIngredientsList({ groups }: { groups: BundleIngredientGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <div className="space-y-8 sm:space-y-10">
      {groups.map((g, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
        >
          {g.name && (
            <div className="flex items-center gap-3 mb-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#5f3d4e] to-[#4d9ab5] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                {i + 1}
              </span>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">{g.name}</h3>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}
          <IngredientsCloud text={g.ingredients} />
        </motion.div>
      ))}
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
  <svg key="1" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3s-6 7.5-6 11a6 6 0 0012 0c0-3.5-6-11-6-11z"/></svg>,
  <svg key="2" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>,
  <svg key="3" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"/></svg>,
  <svg key="4" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
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
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="group relative bg-white rounded-2xl p-6 shadow-sm border border-white/80 flex flex-col gap-4 transition-all duration-300 hover:shadow-[0_16px_40px_rgba(95,61,78,0.10)] hover:-translate-y-1 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#5f3d4e] to-[#4d9ab5] flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110">
              {STEP_ICONS[i % STEP_ICONS.length]}
            </div>
            <span className="text-5xl font-black text-gray-100 leading-none select-none">{i+1}</span>
          </div>
          {step.title && <p className="text-[11px] font-bold uppercase tracking-widest text-gray-900">{step.title}</p>}
          <p className="text-sm text-gray-500 leading-6">{step.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Scroll-reveal wrapper — fades/slides a section's content in once, the
// first time it enters the viewport, instead of everything below the fold
// sitting static until scrolled to. ─────────────────────────────────────────
function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Trust badges ─────────────────────────────────────────────────────────
const TRUST_BADGES = [
  { label: "100% Authentic", icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.031 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
  { label: "Cash on Delivery", icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3M4.5 19.5h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z" },
  { label: "Dermatologist Tested", icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8 1.4 2.8a1.5 1.5 0 01-1.34 2.15H4.14A1.5 1.5 0 012.8 18.1l1.4-2.8" },
];

function TrustBadges() {
  return (
    <div className="grid grid-cols-3 gap-2 mt-5">
      {TRUST_BADGES.map((b, i) => (
        <motion.div
          key={b.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 + i * 0.08 }}
          className="flex flex-col items-center gap-2 text-center rounded-xl bg-gradient-to-b from-[#fbf5f7] to-[#f7fbfd] border border-[#f0dde3] py-3 px-1.5"
        >
          <svg className="h-5 w-5 text-[#5f3d4e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d={b.icon}/></svg>
          <span className="text-[9.5px] font-semibold uppercase tracking-wide text-gray-600 leading-tight">{b.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Fullscreen image lightbox ──────────────────────────────────────────────
function Lightbox({
  images, activeIndex, onClose, onPrev, onNext,
}: {
  images: { id: string; url: string }[];
  activeIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while the lightbox is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext]);

  const touchX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchX.current;
    if (delta > 60) onPrev();
    else if (delta < -60) onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            aria-label="Previous image"
            className="absolute left-3 sm:left-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            aria-label="Next image"
            className="absolute right-3 sm:right-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}

      <motion.div
        key={images[activeIndex]?.id}
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-[88vw] h-[70vh] sm:w-[70vw] sm:h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image src={images[activeIndex]?.url ?? ""} alt="" fill className="object-contain" sizes="90vw" />
      </motion.div>

      {images.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Sticky scroll-spy section nav ──────────────────────────────────────────
function SectionNav({ sections, activeId, onJump }: { sections: { id: string; label: string }[]; activeId: string; onJump: (id: string) => void }) {
  if (sections.length < 2) return null;
  return (
    <div className="sticky top-[148px] lg:top-[192px] z-30 w-full border-y border-gray-200/70 bg-[#f1efef]/95 backdrop-blur-sm">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
        <div className="flex gap-6 overflow-x-auto scrollbar-hide">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => onJump(s.id)}
              className={`relative flex-shrink-0 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] whitespace-nowrap transition-colors active:scale-95 ${
                activeId === s.id ? "text-[#5f3d4e]" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {s.label}
              {activeId === s.id && (
                <motion.span
                  layoutId="section-nav-underline"
                  className="absolute left-0 right-0 -bottom-px h-[2px] bg-gradient-to-r from-[#5f3d4e] to-[#4d9ab5] rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Loved product card ──────────────────────────────────────────────────────
// Deliberately NOT the homepage's minimal ProductCard — bordered, shadowed,
// with a star rating and a full-width "Add to Bag" button instead of a small
// icon, so this section reads as its own distinct, more clickable shop-card
// style rather than a repeat of what's already above it on the page.
function LovedProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const primaryImage = product.images[0]?.url ?? "/shot1.png";
  const hasDiscount = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100) : 0;

  const handleAdd = () => {
    addItem({ variantId: product.variantId, name: product.name, price: product.price, image: primaryImage });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="group rounded-2xl overflow-hidden bg-white border border-[#f0dde3] shadow-[0_14px_36px_rgba(95,61,78,0.10)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_56px_rgba(95,61,78,0.20)]">
      <Link href={`/products/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-[#f7ecec]">
        <Image src={primaryImage} alt={product.name} fill
          sizes="(max-width: 768px) 60vw, (max-width: 1024px) 40vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-700 shadow-sm">{product.badge}</span>
        {hasDiscount && (
          <span className="absolute top-3 right-3 bg-gradient-to-r from-[#5f3d4e] to-[#8a5a70] text-white px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm">
            {discountPct}% OFF
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.id}`} className="block">
          <p className="text-sm font-semibold text-gray-900 leading-tight truncate mb-1.5 transition-colors group-hover:text-[#5f3d4e]">{product.name}</p>
        </Link>
        <div className="flex items-center gap-0.5 mb-2.5">
          {[1,2,3,4,5].map(s => (
            <svg key={s} className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-base font-bold bg-gradient-to-r from-[#5f3d4e] to-[#4d9ab5] bg-clip-text text-transparent">PKR {product.price}</span>
          {hasDiscount && <span className="text-xs text-gray-400 line-through">PKR {product.compareAtPrice}</span>}
        </div>
        <button
          onClick={handleAdd}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-[11px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 active:scale-[0.97] ${
            added ? "bg-rose-400 text-white" : "bg-gray-900 text-white hover:bg-gray-700 hover:shadow-[0_8px_20px_rgba(17,24,39,0.28)]"
          }`}
        >
          {added
            ? <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Added</>
            : <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>Add to Bag</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Most Loved — related products from the same category ───────────────────
// Horizontal snap-scroll on mobile (most visitors are on mobile, so scanning
// sideways with a thumb is the natural interaction), a static 4-up grid on
// desktop.
function MostLoved({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <section className="bg-gradient-to-br from-[#5f3d4e]/5 via-[#f1efef] to-[#4d9ab5]/5 py-10 sm:py-14 border-t border-gray-200">
      <Reveal className="max-w-screen-xl mx-auto px-6 lg:px-10">
        <SectionHeading
          title="Most Loved"
          icon={<svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>}
        />

        {/* Mobile: horizontal snap scroll */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-6 px-6 scrollbar-hide lg:hidden">
          {products.slice(0, 6).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="min-w-[62%] sm:min-w-[38%] flex-shrink-0 snap-start"
            >
              <LovedProductCard product={p} />
            </motion.div>
          ))}
        </div>

        {/* Desktop: static grid */}
        <div className="hidden lg:grid grid-cols-4 gap-6">
          {products.slice(0, 4).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <LovedProductCard product={p} />
            </motion.div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
// Receives the product already fetched server-side — the price, name, and
// details are in the initial HTML the browser renders, BEFORE any JS runs.
// A customer on a slow/flaky connection (mobile data, in-app browser) sees the
// real product immediately even if React never finishes hydrating — only the
// interactive bits below (gallery, add to cart, buy now) need JS.
export default function ProductClient({ product, relatedProducts = [] }: { product: Product; relatedProducts?: Product[] }) {
  const { addItem } = useCart();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity]   = useState(1);
  const [added, setAdded]         = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [buyNowError, setBuyNowError] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState("overview");
  const touchStartX = useRef(0);

  // Meta Pixel: product view
  useEffect(() => {
    fbTrack("ViewContent", {
      content_ids: [product.variantId],
      content_name: product.name,
      content_type: "product",
      value: product.price,
      currency: "PKR",
    });
    // Our own log, independent of Meta's dashboard — lets us compare page
    // views against add_to_cart/buy_now counts for the same product directly
    // in our own logs, and catches views Meta's pixel might miss (ad blockers,
    // in-app browsers that block third-party trackers but not same-origin
    // requests).
    logEvent("product_view", {
      variantId: product.variantId,
      name: product.name,
      price: product.price,
    });
  }, [product]);

  // Sticky mobile buy bar — only surfaces once the main CTAs have scrolled
  // out of view, so it doesn't duplicate a button already on screen. Also
  // toggles a body class so the floating WhatsApp button (rendered globally
  // in layout.tsx, outside this component) lifts clear of the bar instead of
  // the two overlapping at the bottom-right corner.
  useEffect(() => {
    const onScroll = () => {
      const visible = window.scrollY > 620 && window.innerWidth < 1024;
      setShowStickyBar(visible);
      document.body.classList.toggle("pdp-sticky-bar-visible", visible);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.body.classList.remove("pdp-sticky-bar-visible");
    };
  }, []);

  // Mobile only, every screen size: auto-scroll past the navbar/back-button
  // chrome straight to the product content (title/image/price/buy buttons),
  // so a visitor never has to manually scroll past dead space to reach the
  // purchase actions. Manually computed scrollTo (not scrollIntoView) fired
  // after a settle delay + double rAF — a bare scrollIntoView on a fixed
  // timer was getting silently overridden by the browser's own scroll
  // handling around navigation; this version reliably lands where intended.
  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;
    let cancelled = false;

    const scrollToOverview = () => {
      if (cancelled) return;
      const el = document.getElementById("overview");
      if (!el) return;
      const OFFSET = 148; // matches #overview's scroll-mt-[148px]
      const top = el.getBoundingClientRect().top + window.scrollY - OFFSET;
      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    };

    const t = setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(scrollToOverview));
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [product.id]);

  const sections = [
    { id: "overview", label: "Overview" },
    ...(product.ingredients ? [{ id: "ingredients", label: "Ingredients" }] : []),
    ...(product.howToUse ? [{ id: "how-to-use", label: "How to Use" }] : []),
    ...(product.whenToUse ? [{ id: "when-to-use", label: "When to Use" }] : []),
    { id: "more-info", label: "More Info" },
  ];

  // Scroll-spy: highlights whichever section's heading is nearest the top of
  // the viewport, so the section nav tracks scroll position instead of only
  // reacting to clicks.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSectionId(visible[0].target.id);
        }
      },
      { rootMargin: "-160px 0px -70% 0px" }
    );
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.ingredients, product.howToUse, product.whenToUse]);

  const jumpToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToImage = (dir: 1 | -1) => {
    setActiveImage(i => (i + dir + images.length) % images.length);
  };

  const onGalleryTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onGalleryTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) < 40) return;
    goToImage(delta < 0 ? 1 : -1);
  };

  const handleAddToCart = () => {
    addItem({ variantId: product.variantId, name: product.name, price: product.price, image: product.images[0]?.url ?? "" });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleBuyNow = async () => {
    if (buyingNow) return;
    setBuyingNow(true);
    setBuyNowError(false);
    logEvent("buy_now_click", { variantId: product.variantId, name: product.name, quantity, value: product.price * quantity });
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
    // Hard timeout + one automatic retry on a dropped connection — the exact
    // net::ERR_HTTP2_PING_FAILED case, which recovers on retry. We do NOT retry
    // on a 5xx response: the server may have already created the cart, and we'd
    // rather show a retry button than risk a duplicate.
    try {
      const res = await fetchWithRetry("/api/buy-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: product.variantId, quantity }),
        timeoutMs: 15000,
        retries: 1,
        retryOnServerError: false,
      });
      const { checkoutUrl } = await res.json();
      if (checkoutUrl) {
        logEvent("buy_now_success", { variantId: product.variantId });
        window.location.href = checkoutUrl;
      } else {
        logEvent("buy_now_failed", { variantId: product.variantId, reason: "no_checkout_url" });
        setBuyingNow(false);
        setBuyNowError(true);
      }
    } catch (err) {
      logEvent("buy_now_failed", { variantId: product.variantId, reason: "network_error", message: (err as Error)?.message });
      setBuyingNow(false);
      setBuyNowError(true);
    }
  };

  const images = product.images;
  const hasDiscount = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100) : 0;

  // Optional per-breakpoint hero photo, sourced from Shopify metafields
  // "mobile_hero_image" / "desktop_hero_image" — only overrides the FIRST
  // gallery photo (index 0); swiping to other images still shows the normal
  // product gallery on both breakpoints. Falls back to the regular product
  // photo when a metafield isn't set, so this is fully optional per product.
  const mobileHeroSrc = product.mobileHeroImage || images[0]?.url || "/shot1.png";
  const desktopHeroSrc = product.desktopHeroImage || images[0]?.url || "/shot1.png";

  return (
    <main className="min-h-screen bg-[#f1efef]">
      <Navbar />

      {/* Breadcrumb — full trail only on desktop; mobile just gets the back
          button, so the small viewport isn't spent on navigation chrome
          before the shopper has even seen the product. */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10 pt-[148px] pb-2 lg:pb-4">
        <div className="mb-2 lg:mb-4"><BackButton href="/skincare" /></div>
        <nav className="hidden lg:flex items-center gap-2 text-[11px] text-gray-400 uppercase tracking-widest">
          <Link href="/" className="hover:text-gray-700 transition">Home</Link>
          <span>/</span>
          <Link href={product.category === "skincare" ? "/skincare" : "/"} className="hover:text-gray-700 transition capitalize">
            {product.category === "all" ? "Shop" : product.category}
          </Link>
          <span>/</span>
          <span className="text-gray-600">{product.name}</span>
        </nav>
      </div>

      {/* ── Main product grid ──
          Mobile order (via CSS `order`, single DOM — no duplicated markup):
          title/price → image → buy buttons → trust badges. Puts the two
          purchase actions right under the photo instead of at the bottom of
          a long info column, so they're reachable within a beat of opening
          the page. Desktop keeps the original two-column layout untouched:
          image spans both rows on the left, info stacks on the right. */}
      <div id="overview" className="max-w-screen-xl mx-auto px-6 lg:px-10 py-4 lg:py-6 scroll-mt-[148px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-2 gap-x-12 lg:gap-x-20 gap-y-5 lg:gap-y-0">

          {/* Title + price */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="order-1 lg:order-none lg:col-start-2 lg:row-start-1 lg:self-end"
          >
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#4d9ab5] font-semibold mb-1.5 sm:mb-3">{product.type}</p>
            <h1 className="text-[1.7rem] leading-tight sm:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-gray-900 mb-2 sm:mb-3 break-words">{product.name}</h1>
            <div className="mb-2.5 sm:mb-5"><Stars count={product.badge==="best seller"?5:4} /></div>

            {/* Desktop only — price sits beside the image here, not above it,
                so this is fine; on mobile it moves to its own row below the
                image instead (see the block right after Image). */}
            <div className="hidden lg:flex items-baseline gap-2.5 sm:gap-3 flex-wrap">
              <span className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-[#5f3d4e] to-[#4d9ab5] bg-clip-text text-transparent">PKR {product.price}</span>
              {hasDiscount && (
                <>
                  <span className="text-base sm:text-lg text-gray-400 line-through">PKR {product.compareAtPrice}</span>
                  <span className="text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-400 to-[#5f3d4e] px-2.5 py-1 rounded-full shadow-sm">
                    {discountPct}% OFF
                  </span>
                </>
              )}
              {product.shades && <span className="text-xs text-gray-400 uppercase tracking-wide">{product.shades}</span>}
            </div>
          </motion.div>

          {/* Image */}
          {/* lg:self-start — without it, CSS Grid's default stretch forces
              this block (it spans both rows via row-span-2) to match the
              info column's full combined height, while the image inside
              only fills its own natural aspect-ratio height, leaving visible
              empty gradient background below it. self-start makes the block
              size to the image itself instead, so the photo fully fills its
              own card with no leftover space. */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
            className="order-2 lg:order-none lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:self-start flex flex-col lg:flex-row gap-3 lg:gap-4"
          >
            {/* Thumbnail rail — desktop only. On mobile, swipe the photo
                itself to browse (handlers below) plus the dot indicators;
                a row of tiny thumbnails ate space and duplicated what
                swiping already does on a touch screen. */}
            {images.length > 1 && (
              <div className="hidden lg:flex lg:flex-col gap-2.5 w-16 flex-shrink-0">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImage(i)}
                    className={`relative w-16 h-16 flex-shrink-0 rounded-xl bg-[#dff0f8] overflow-hidden border-2 transition-all duration-200 active:scale-90 ${activeImage === i ? "border-[#5f3d4e] shadow-[0_4px_14px_rgba(95,61,78,0.25)]" : "border-transparent hover:border-[#4d9ab5]/50"}`}>
                    <Image src={img.url} alt="" fill className={i===0?"object-contain p-1":"object-cover"} sizes="64px" />
                  </button>
                ))}
              </div>
            )}
            <div
              className="flex-1 rounded-2xl bg-gradient-to-br from-[#dff0f8] to-[#fbeef2] overflow-hidden relative group shadow-[0_24px_60px_rgba(95,61,78,0.12)] cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
              onTouchStart={onGalleryTouchStart}
              onTouchEnd={onGalleryTouchEnd}
            >
              {/* Mobile: capped aspect ratio + cropped fill, so the hero photo
                  doesn't dominate the whole first screen and push the buy
                  buttons out of reach — full detail is one tap away via the
                  lightbox. Desktop keeps the original uncropped natural
                  aspect (hidden here uses display:none, so the browser never
                  fetches whichever variant isn't shown — no double-loading). */}
              <div className="relative aspect-[4/3] lg:hidden">
                {/* object-cover on every mobile image (custom hero or regular
                    product photo) so the frame is always fully filled edge-
                    to-edge with no empty letterbox margin — accepted
                    trade-off is that a very tall/narrow product photo may
                    get its top/bottom trimmed slightly. */}
                <Image src={mobileHeroSrc} alt={product.name} fill sizes="100vw"
                  style={{ visibility: activeImage===0?"visible":"hidden" }}
                  className="object-cover transition-transform duration-500 ease-out" priority />
                {images.slice(1).map((img,i) => (
                  <Image key={`${img.id}-m`} src={img.url} alt={product.name} fill
                    className={`object-cover transition-opacity duration-500 ease-out ${activeImage===i+1?"opacity-100":"opacity-0"}`}
                    sizes="100vw" />
                ))}
                {/* Swipe hints — subtle, non-interactive chevrons on whichever
                    edge(s) still have more photos to see; disappear once
                    there's nothing further in that direction. */}
                {images.length > 1 && activeImage > 0 && (
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-white pointer-events-none">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </span>
                )}
                {images.length > 1 && activeImage < images.length - 1 && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-white pointer-events-none">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </span>
                )}
              </div>
              <div className="hidden lg:block relative">
                {/* Natural intrinsic sizing (no fixed container height) means
                    a custom desktop_hero_image renders at its own true
                    aspect ratio automatically — no cropping/letterbox logic
                    needed here, unlike the mobile block above. */}
                <Image src={desktopHeroSrc} alt={product.name}
                  width={0} height={0} sizes="50vw"
                  style={{ width:"100%", height:"auto", visibility: activeImage===0?"visible":"hidden" }}
                  className="transition-transform duration-500 ease-out group-hover:scale-105" priority />
                {images.slice(1).map((img,i) => (
                  <Image key={`${img.id}-d`} src={img.url} alt={product.name} fill
                    className={`object-cover transition-opacity duration-500 ease-out group-hover:scale-105 ${activeImage===i+1?"opacity-100":"opacity-0"}`}
                    sizes="50vw" />
                ))}
              </div>

              <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest text-gray-700 shadow-md z-10 font-medium">{product.badge}</span>
              {hasDiscount && (
                <span className="absolute top-4 right-4 bg-gradient-to-r from-[#5f3d4e] to-[#8a5a70] text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md z-10">
                  {discountPct}% OFF
                </span>
              )}
              <span className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16zM11 8v6m-3-3h6" /></svg>
              </span>
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setActiveImage(i); }}
                      aria-label={`View image ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${activeImage === i ? "w-5 bg-[#5f3d4e]" : "w-1.5 bg-white/70"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Buy box — price, qty, buttons, trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.14 }}
            className="order-3 lg:order-none lg:col-start-2 lg:row-start-2 lg:self-start flex flex-col"
          >
            {/* Price — mobile only, right-aligned, directly above the Qty
                row with a tight margin (not the wider grid gap) so it sits
                as close to Add to Bag / Buy Now as possible. Desktop already
                shows price beside the image (in the Title block above), so
                this is hidden there. */}
            <div className="lg:hidden flex items-baseline justify-end gap-2.5 flex-wrap mb-3">
              {product.shades && <span className="text-xs text-gray-400 uppercase tracking-wide">{product.shades}</span>}
              {hasDiscount && (
                <>
                  <span className="text-xs font-bold text-white bg-gradient-to-r from-rose-400 to-[#5f3d4e] px-2.5 py-1 rounded-full shadow-sm">
                    {discountPct}% OFF
                  </span>
                  <span className="text-sm text-gray-400 line-through">PKR {product.compareAtPrice}</span>
                </>
              )}
              <span className="text-2xl font-bold bg-gradient-to-r from-[#5f3d4e] to-[#4d9ab5] bg-clip-text text-transparent">PKR {product.price}</span>
            </div>

            {/* Divider + tagline: desktop only, positioned exactly where they
                sat before (right after price) — skipped on mobile so nothing
                sits between the photo and the buy buttons. */}
            {(product.tagline) && (
              <div className="hidden lg:block">
                <div className="w-full h-px bg-gradient-to-r from-gray-200 via-gray-200 to-transparent mb-5" />
                <p className="text-sm font-medium text-gray-700 mb-6">{product.tagline}</p>
              </div>
            )}

            {/* Qty */}
            <div className="flex items-center gap-4 mb-3 sm:mb-5">
              <p className="text-xs uppercase tracking-widest text-gray-500">Qty</p>
              <div className="flex items-center rounded-full border border-gray-200 overflow-hidden">
                <button onClick={() => setQuantity(q => Math.max(1,q-1))} className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-90 transition text-lg">−</button>
                <span className="w-10 text-center text-sm text-gray-900">
                  <motion.span key={quantity} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.15 }} className="inline-block">
                    {quantity}
                  </motion.span>
                </span>
                <button onClick={() => setQuantity(q => q+1)} className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-90 transition text-lg">+</button>
              </div>
            </div>

            {/* Add to Bag */}
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddToCart}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-full text-sm uppercase tracking-[0.25em] font-medium transition-all duration-300 shadow-[0_10px_30px_rgba(17,24,39,0.18)] hover:shadow-[0_14px_36px_rgba(17,24,39,0.28)] hover:-translate-y-0.5 ${added?"bg-rose-400 text-white":"bg-gray-900 text-white hover:bg-gray-700"}`}>
              {added
                ? <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Added to Bag</>
                : <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>Add to Bag</>
              }
            </motion.button>

            {/* Buy Now */}
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleBuyNow} disabled={buyingNow}
              className="w-full flex items-center justify-center gap-2 py-4 mt-3 rounded-full text-sm uppercase tracking-[0.25em] font-medium bg-gradient-to-r from-[#4d9ab5] to-[#3a7a91] text-white hover:brightness-105 transition-all duration-300 shadow-[0_10px_30px_rgba(77,154,181,0.25)] hover:shadow-[0_14px_36px_rgba(77,154,181,0.35)] hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0">
              {buyingNow
                ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>Buy Now</>
              }
            </motion.button>
            {buyNowError && (
              <p className="text-xs text-rose-500 mt-2 text-center">Checkout is taking too long. Please try again.</p>
            )}

            <TrustBadges />
          </motion.div>
        </div>
      </div>

      <SectionNav sections={sections} activeId={activeSectionId} onJump={jumpToSection} />

      {/* ── Ingredients (always visible) ────────────────────────────────────── */}
      {(product.ingredients || product.bundleIngredients) && (
        <section id="ingredients" className="bg-white py-10 sm:py-14 border-t border-gray-200 scroll-mt-[196px] lg:scroll-mt-[240px]">
          <Reveal className="max-w-screen-xl mx-auto px-6 lg:px-10">
            <SectionHeading
              title="Ingredients"
              icon={<svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>}
            />
            <IngredientsSection
              text={product.ingredients ?? ""}
              spotlightImages={parseSpotlightImages(product.spotlightImages)}
              bundleGroups={product.bundleIngredients ? parseBundleIngredients(product.bundleIngredients) : undefined}
            />
          </Reveal>
        </section>
      )}

      {/* ── How to Use (always visible) ─────────────────────────────────────── */}
      {product.howToUse && (
        <section id="how-to-use" className="bg-gradient-to-b from-[#e8f4fa] to-[#fbf1f4] py-10 sm:py-14 scroll-mt-[196px] lg:scroll-mt-[240px]">
          <Reveal className="max-w-screen-xl mx-auto px-6 lg:px-10">
            <SectionHeading
              title="How to Use"
              icon={<svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>}
            />
            <HowToUseSteps text={product.howToUse} />
          </Reveal>
        </section>
      )}

      {/* ── When to Use (always visible) ────────────────────────────────────── */}
      {product.whenToUse && (
        <section id="when-to-use" className="bg-white py-10 sm:py-14 border-t border-gray-200 scroll-mt-[196px] lg:scroll-mt-[240px]">
          <Reveal className="max-w-screen-xl mx-auto px-6 lg:px-10">
            <SectionHeading
              title="When to Use"
              icon={<svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            />
            <WhenToUse value={product.whenToUse} />
          </Reveal>
        </section>
      )}

      {/* ── Patch Test, Key Benefits, Shipping & Returns — accordions ───────── */}
      <section id="more-info" className="bg-white border-t border-gray-200 scroll-mt-[196px] lg:scroll-mt-[240px]">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 pt-4 pb-16 sm:pb-24">

          {product.patchTest && (
            <Accordion
              title="Patch Test"
              defaultOpen
              icon={<svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.031 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>}
            >
              <PatchTestSteps text={product.patchTest} />
            </Accordion>
          )}

          {product.benefits && (
            <Accordion
              title="Key Benefits"
              defaultOpen={!product.patchTest}
              icon={<svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>}
            >
              <BenefitsGrid text={product.benefits} />
            </Accordion>
          )}

          <Accordion
            title="Shipping & Returns"
            icon={<svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { icon:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", title:"Delivery Time", desc:"3 to 5 business days across Pakistan" },
                { icon:"M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z", title:"Shipping Cost", desc:"PKR 200 flat rate across Pakistan" },
                { icon:"M6 18 18 6M6 6l12 12", title:"No Returns", desc:"All sales are final. For hygiene & safety reasons, we don't accept returns or exchanges." },
              ].map(item => (
                <div key={item.title} className="bg-gradient-to-b from-[#f7fbfd] to-[#fbf5f7] rounded-2xl p-6 border border-[#d6ecf7] flex flex-col gap-4 transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(95,61,78,0.08)]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5f3d4e] to-[#4d9ab5] flex items-center justify-center shadow-sm">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
              All sales are final — we do not offer returns or exchanges. Full details in our{" "}
              <Link href="/returns" className="underline text-gray-600 hover:text-gray-900 transition">Return Policy</Link>{" "}
              and{" "}
              <Link href="/shipping" className="underline text-gray-600 hover:text-gray-900 transition">Shipping Policy</Link>.
            </p>
          </Accordion>

        </div>
      </section>

      <MostLoved products={relatedProducts} />

      <Footer />

      {/* ── Sticky mobile buy bar — appears once the main CTAs scroll away ──── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 lg:hidden transition-transform duration-300 ${showStickyBar ? "translate-y-0" : "translate-y-full"}`}
      >
        <div
          className="flex items-center gap-3 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 truncate">{product.name}</p>
            <p className="text-sm font-semibold bg-gradient-to-r from-[#5f3d4e] to-[#4d9ab5] bg-clip-text text-transparent">PKR {product.price}</p>
          </div>
          {/* Icon-only, not a full labeled button — keeps this row from
              wrapping on narrow phones while still fitting Buy Now beside it.
              Calls the same handleAddToCart used up top, so it fires the
              same fbTrack("AddToCart") pixel event via CartContext.addItem. */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleAddToCart}
            aria-label="Add to Bag"
            className={`flex-shrink-0 flex items-center justify-center h-11 w-11 rounded-full border transition-all duration-300 ${added ? "bg-rose-400 border-rose-400 text-white" : "bg-white border-gray-300 text-gray-700"}`}>
            {added
              ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            }
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleBuyNow} disabled={buyingNow}
            className="flex-shrink-0 rounded-full bg-gradient-to-r from-[#5f3d4e] to-[#4d9ab5] text-white px-5 py-2.5 text-xs uppercase tracking-[0.2em] font-medium shadow-md disabled:opacity-60">
            {buyingNow ? "..." : "Buy Now"}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            images={images}
            activeIndex={activeImage}
            onClose={() => setLightboxOpen(false)}
            onPrev={() => goToImage(-1)}
            onNext={() => goToImage(1)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
