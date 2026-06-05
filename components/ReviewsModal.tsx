"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FaStar, FaTimes } from "react-icons/fa";
import { useRef } from "react";

export interface Review {
  id: number;
  name: string;
  rating: number;
  date: string;
  text: string;
}

interface ReviewsModalProps {
  open: boolean;
  onClose: () => void;
  onAddReview: () => void;
  reviews: Review[];
}

export default function ReviewsModal({
  open,
  onClose,
  onAddReview,
  reviews,
}: ReviewsModalProps) {
  const reviewListRef = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_35px_90px_rgba(15,23,42,0.2)]"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close reviews modal"
              className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-200 hover:bg-slate-100"
            >
              <FaTimes className="h-4 w-4" />
            </button>

            <div className="px-6 py-8 lg:px-10 lg:py-10">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">
                      Customer feedback
                    </p>
                    <h2 className="text-3xl font-semibold text-slate-900">
                      What our customers are saying
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-slate-600">
                      Read the latest reviews from happy shoppers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onAddReview}
                    className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-emerald-700 whitespace-nowrap"
                  >
                    + Add Review
                  </button>
                </div>

                <div
                  ref={reviewListRef}
                  className="max-h-[58vh] space-y-4 overflow-y-auto pr-2 pb-2 text-sm text-slate-700"
                >
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {review.name}
                            </p>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                              {review.date}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: 5 }, (_, index) => (
                              <FaStar
                                key={index}
                                className={
                                  index < review.rating
                                    ? "h-3.5 w-3.5"
                                    : "h-3.5 w-3.5 text-slate-300"
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <p className="mt-4 leading-7 text-slate-600">
                          {review.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg bg-slate-50">
                      <p className="text-slate-500">No reviews yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
