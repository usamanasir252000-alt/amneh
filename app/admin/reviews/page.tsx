"use client";

import { useEffect, useState } from "react";
import AdminReviewForm from "@/components/admin/ReviewFormAdmin";
import { FaStar } from "react-icons/fa";

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews");
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Reviews</h1>
        <p className="mt-2 text-gray-600">
          Create new customer reviews and view all existing reviews.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Add New Review
          </h2>
          <AdminReviewForm onSuccess={fetchReviews} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            All Reviews ({reviews.length})
          </h2>
          <div className="max-h-96 space-y-4 overflow-y-auto">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-gray-500">Loading reviews...</p>
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 text-amber-400">
                      {Array.from({ length: 5 }, (_, i) => (
                        <FaStar
                          key={i}
                          className={
                            i < review.rating
                              ? "h-4 w-4"
                              : "h-4 w-4 text-gray-300"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 leading-6">
                    {review.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex h-40 items-center justify-center">
                <p className="text-gray-500">No reviews yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
