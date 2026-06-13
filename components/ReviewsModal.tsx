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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-Deep_blue/20 bg-white/95 shadow-soft"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* <button
              type="button"
              onClick={onClose}
              aria-label="Close reviews modal"
              className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-Deep_blue/20 bg-light_blue text-Deep_blue shadow-sm transition duration-200 hover:bg-soft_blue"
            >
              <FaTimes className="h-4 w-4" />
            </button> */}

            <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3 flex-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-Deep_blue sm:text-sm">
                      Customer feedback
                    </p>
                    <h2 className="text-2xl font-semibold text-Deep_blue sm:text-3xl">
                      What shoppers are saying about Amneh
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                      Read honest ratings and buyer stories from our community.
                    </p>
                  </div>
                  <div className="flex w-full justify-center sm:w-auto sm:justify-end">
                    <button
                      type="button"
                      onClick={onAddReview}
                      className="inline-flex w-full justify-center rounded-lg bg-Deep_blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-Deep_blue/90 sm:w-auto"
                    >
                      Add Review
                    </button>
                  </div>
                </div>

                <div
                  ref={reviewListRef}
                  className="max-h-[58vh] space-y-4 overflow-y-auto pr-2 pb-2 text-sm text-slate-700"
                >
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-[1.6rem] border border-Deep_blue/10 bg-light_blue p-5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-lg font-semibold text-Deep_blue">
                              {review.name}
                            </p>
                            <p className="text-xs uppercase tracking-[0.24em] text-Deep_blue/70">
                              {review.date}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-Deep_blue">
                            {Array.from({ length: 5 }, (_, index) => (
                              <FaStar
                                key={index}
                                className={
                                  index < review.rating
                                    ? "h-3.5 w-3.5"
                                    : "h-3.5 w-3.5 text-Deep_blue/30"
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <p className="mt-4 leading-7 text-slate-700 sm:text-base">
                          {review.text}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg bg-light_blue">
                      <p className="text-Deep_blue/70">No reviews yet.</p>
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
