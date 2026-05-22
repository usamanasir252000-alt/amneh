import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeatureSplit from "../components/FeatureSplit";
import ProductCarousel from "../components/ProductCarousel";
import FullWidthBanner from "../components/FullWidthBanner";
import SocialFeed from "../components/SocialFeed";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />

      {/* Sections separated by a visible blush-pink gap — paddingTop adds the gap after the hero too */}
      <div
        className="flex flex-col"
        style={{ gap: "56px", background: "#f1efef", paddingTop: "56px" }}
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
