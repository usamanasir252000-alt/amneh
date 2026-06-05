"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FaStar, FaTimes, FaCheck, FaExclamationCircle } from "react-icons/fa";
import { useState } from "react";

interface AddReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddReviewModal({
  open,
  onClose,
  onSuccess,
}: AddReviewModalProps) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating, text }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess(true);
      setName("");
      setRating(5);
      setText("");

      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

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
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_35px_90px_rgba(15,23,42,0.2)]"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close add review modal"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition duration-200 hover:bg-slate-100"
            >
              <FaTimes className="h-4 w-4" />
            </button>

            <div className="px-6 py-8 lg:px-8 lg:py-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">
                    Share your experience
                  </p>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Add Your Review
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                      Your Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Sarah M."
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Your Rating
                    </label>
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="transition duration-200 transform hover:scale-110"
                        >
                          <FaStar
                            className={
                              star <= rating
                                ? "h-6 w-6 text-amber-400"
                                : "h-6 w-6 text-slate-300"
                            }
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm font-medium text-slate-600">
                        {rating}/5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="text"
                      className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                      Your Review
                    </label>
                    <textarea
                      id="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Tell us what you think about this product..."
                      required
                      rows={5}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                      <FaExclamationCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-start gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-200">
                      <FaCheck className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>Review submitted successfully!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || success}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
