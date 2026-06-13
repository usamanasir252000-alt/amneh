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
          className="flex h-14 w-40 items-center justify-start rounded-l-full border border-Deep_blue/20 bg-Deep_blue/5 px-4 text-left text-sm font-semibold text-Deep_blue shadow-sm transition duration-200 hover:bg-Deep_blue/10 hover:text-Deep_blue"
        >
          <FaRegComments className="mr-3 h-4 w-4 text-Deep_blue" />
          View Reviews
        </button>

        <button
          type="button"
          onClick={onAddReview}
          className="flex h-14 w-40 items-center justify-start rounded-l-full border border-Deep_blue bg-Deep_blue px-4 text-left text-sm font-semibold text-white shadow-xl shadow-Deep_blue/30 transition duration-200 hover:bg-Deep_blue/90"
        >
          <FaPlus className="mr-3 h-4 w-4" />
          Add Review
        </button>
      </div>
    </motion.div>
  );
}
