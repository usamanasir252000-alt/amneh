"use client";

import { FaStar } from "react-icons/fa";

interface ReviewSideTabProps {
  onClick: () => void;
}

export default function ReviewSideTab({ onClick }: ReviewSideTabProps) {
  return (
    <div className="fixed right-0 top-2/3 z-50 -translate-y-1/2">
      <button
        type="button"
        onClick={onClick}
        className="group flex items-center gap-3 rounded-l-full border border-slate-200 bg-white/95 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-950/10 transition duration-200 ease-out transform translate-x-1/2 hover:translate-x-0 hover:border-slate-300 hover:bg-slate-50"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 transition duration-200 group-hover:scale-105">
          <FaStar className="h-4 w-4" />
        </span>
        <span className="whitespace-nowrap">Reviews</span>
      </button>
    </div>
  );
}
