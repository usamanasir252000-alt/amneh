"use client";

import { useState } from "react";
import { FaStar, FaCheck, FaExclamationCircle } from "react-icons/fa";

interface AdminReviewFormProps {
  onSuccess?: () => void;
}

export default function AdminReviewForm({ onSuccess }: AdminReviewFormProps) {
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
        throw new Error(data.error || "Failed to create review");
      }

      setSuccess(true);
      setName("");
      setRating(5);
      setText("");

      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Customer Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Sarah M."
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Rating
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
                      : "h-6 w-6 text-gray-300"
                  }
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-medium text-gray-600">
              {rating}/5
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="text"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Review Text
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What did they say about the product?"
            required
            rows={5}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            <FaExclamationCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-200">
            <FaCheck className="h-4 w-4 flex-shrink-0" />
            <span>Review created successfully!</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || success}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Review"}
        </button>
      </form>
    </div>
  );
}
