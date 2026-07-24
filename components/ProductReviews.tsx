"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AddReviewModal } from "./AddReviewModal";

interface Review {
  id: string | number;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface ProductReviewsProps {
  productHandle: string;
  productName: string;
}

const REVIEWS_PER_PAGE = 5;

export function ProductReviews({ productHandle, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReview, setShowAddReview] = useState(false);
  const [stats, setStats] = useState({ avgRating: 0, count: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reviews?productHandle=${encodeURIComponent(productHandle)}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        const avg = data.reduce((sum: number, r: Review) => sum + r.rating, 0) / data.length;
        setStats({ avgRating: Math.round(avg * 10) / 10, count: data.length });
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productHandle]);

  const handleReviewSubmitted = () => {
    setShowAddReview(false);
    setCurrentPage(1);
    loadReviews();
  };

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const endIndex = startIndex + REVIEWS_PER_PAGE;
  const paginatedReviews = reviews.slice(startIndex, endIndex);

  if (loading) return <div className="h-32 animate-pulse rounded-lg bg-neutral-100" />;

  return (
    <div className="space-y-6">
      <div className="border-t border-neutral-200 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Customer Reviews</h3>
          <button
            onClick={() => setShowAddReview(true)}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Write a Review
          </button>
        </div>

        {stats.count > 0 && (
          <div className="mb-6 flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(stats.avgRating) ? "fill-yellow-400" : "fill-neutral-200"
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-medium">{stats.avgRating.toFixed(1)}</span>
            <span className="text-sm text-neutral-600">({stats.count} reviews)</span>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="rounded-lg bg-neutral-50 p-6 text-center">
            <p className="text-neutral-600">No reviews yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedReviews.map((review) => (
              <div key={review.id} className="border-b border-neutral-200 pb-4 last:border-0">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">{review.name}</p>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating ? "fill-yellow-400" : "fill-neutral-200"
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm text-neutral-700">{review.text}</p>
              </div>
            ))}

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                >
                  ← Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`h-8 w-8 rounded text-sm font-medium transition-colors ${
                        currentPage === i + 1
                          ? "bg-neutral-900 text-white"
                          : "border border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showAddReview && (
        <AddReviewModal
          productHandle={productHandle}
          productName={productName}
          onClose={() => setShowAddReview(false)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
