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
  selected: boolean;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingReviewId, setUpdatingReviewId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews");
      console.log("Fetch reviews response:", response);
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

  const toggleReviewSelected = async (id: string, selected: boolean) => {
    setUpdatingReviewId(id);

    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected }),
      });

      if (!response.ok) {
        throw new Error("Failed to update review selection");
      }

      await fetchReviews();
    } catch (error) {
      console.error("Error updating review selection:", error);
    } finally {
      setUpdatingReviewId(null);
    }
  };

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
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 leading-6">
                      {review.text}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={review.selected}
                          disabled={updatingReviewId === review.id}
                          onChange={(e) =>
                            toggleReviewSelected(review.id, e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Show in reviews modal</span>
                      </label>
                      {review.selected && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
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
