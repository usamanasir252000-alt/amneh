"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeatureSplit from "../components/FeatureSplit";
import ProductCarousel from "../components/ProductCarousel";
import ReviewSideTab from "@/components/ReviewSideTab";
import type { Review } from "@/components/ReviewsModal";
import type { ShopifyProduct } from "@/lib/shopify";

// Below-the-fold / interaction-only — split into their own chunks so they
// don't add to the JS the browser must download and parse before the hero
// and product carousel (the content every visitor actually sees first) can
// become interactive.
const FullWidthBanner = dynamic(() => import("../components/FullWidthBanner"));
const SocialFeed = dynamic(() => import("../components/SocialFeed"));
const Testimonials = dynamic(() => import("@/components/Testimonials"));
const Footer = dynamic(() => import("../components/Footer"));
// Modals are closed by default and only ever needed after a click — no reason
// to server-render or ship their JS until then.
const ReviewsModal = dynamic(() => import("@/components/ReviewsModal"), { ssr: false });
const AddReviewModal = dynamic(() => import("@/components/AddReviewModal"), { ssr: false });

// Client half of the homepage. Products are fetched SERVER-side in app/page.tsx
// and passed in here, so the carousel renders real products into the SSR HTML
// (visible even if a Facebook/Instagram in-app browser never runs the JS).
// Everything interactive (modals, reviews, cart) still hydrates on top.
export default function HomeClient({ initialProducts }: { initialProducts: ShopifyProduct[] }) {
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [addReviewOpen, setAddReviewOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  const loadReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      if (!res.ok) return;
      const data = await res.json();
      const formattedReviews = data.map((r: any) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        text: r.text,
        date: new Date(r.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      }));
      setReviews(formattedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleReviewAdded = () => {
    loadReviews();
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
        <ProductCarousel initialProducts={initialProducts} />
        <Testimonials />
        <FullWidthBanner />
        <SocialFeed />
        <Footer />
      </div>
    </main>
  );
}
