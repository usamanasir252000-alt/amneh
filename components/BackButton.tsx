"use client";

import { useRouter } from "next/navigation";

export default function BackButton({
  light = false,
  href = "/",
}: {
  light?: boolean;
  href?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={`flex items-center gap-1.5 text-xs uppercase tracking-widest transition hover:opacity-60 ${
        light ? "text-white/70" : "text-gray-500"
      }`}
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}
