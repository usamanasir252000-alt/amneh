"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeatureSplit from "../components/FeatureSplit";
import ProductCarousel from "../components/ProductCarousel";
import FullWidthBanner from "../components/FullWidthBanner";
import SocialFeed from "../components/SocialFeed";
import Footer from "../components/Footer";
import ReviewsModal, { Review } from "@/components/ReviewsModal";
import AddReviewModal from "@/components/AddReviewModal";
import ReviewSideTab from "@/components/ReviewSideTab";

export default function Home() {
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [addReviewOpen, setAddReviewOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch("/api/reviews?selected=true");
        if (response.ok) {
          const data = await response.json();
          const formattedReviews = data.map((review: any) => ({
            id: review.id,
            name: review.name,
            rating: review.rating,
            text: review.text,
            date: new Date(review.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          }));
          setReviews(formattedReviews);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleReviewAdded = async () => {
    const response = await fetch("/api/reviews?selected=true");
    if (response.ok) {
      const data = await response.json();
      const formattedReviews = data.map((review: any) => ({
        id: review.id,
        name: review.name,
        rating: review.rating,
        text: review.text,
        date: new Date(review.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      }));
      setReviews(formattedReviews);
    }
  };

  return (
    <main>
      <Navbar />
      <div className="relative">
        <Hero />
        <ReviewSideTab onClick={() => setReviewsOpen(true)} />
      </div>

      <ReviewsModal
        open={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        onAddReview={() => setAddReviewOpen(true)}
        reviews={reviews}
      />

      <AddReviewModal
        open={addReviewOpen}
        onClose={() => setAddReviewOpen(false)}
        onSuccess={handleReviewAdded}
      />

      {/* Sections separated by a visible blush-pink gap — paddingTop adds the gap after the hero too */}
      <div
        className="flex flex-col"
        style={{ gap: "0px", background: "#f1efef", paddingTop: "0px" }}
      >
        <FeatureSplit />
        <ProductCarousel />
        <FullWidthBanner />
        <SocialFeed />
        <Footer />
      </div>
    </main>
  );
}
