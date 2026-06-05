"use client";

import { motion } from "framer-motion";
import { FaPlus, FaRegComments } from "react-icons/fa";

interface ReviewSideButtonsProps {
  onViewReviews: () => void;
  onAddReview: () => void;
}

export default function ReviewSideButtons({
  onViewReviews,
  onAddReview,
}: ReviewSideButtonsProps) {
  return (
    <motion.div
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative flex h-full items-center justify-center"
    >
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 lg:-mr-6">
        <button
          type="button"
          onClick={onViewReviews}
          className="flex h-14 w-40 items-center justify-start rounded-l-full border border-slate-200 bg-slate-50 px-4 text-left text-sm font-semibold text-slate-900 shadow-sm transition duration-200 hover:bg-slate-100 hover:text-slate-950"
        >
          <FaRegComments className="mr-3 h-4 w-4 text-emerald-600" />
          View Reviews
        </button>

        <button
          type="button"
          onClick={onAddReview}
          className="flex h-14 w-40 items-center justify-start rounded-l-full border border-emerald-400 bg-emerald-600 px-4 text-left text-sm font-semibold text-white shadow-xl shadow-emerald-500/20 transition duration-200 hover:bg-emerald-700"
        >
          <FaPlus className="mr-3 h-4 w-4" />
          Add Review
        </button>
      </div>
    </motion.div>
  );
}
