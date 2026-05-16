import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeatureSplit from "../components/FeatureSplit";
import ProductHighlight from "../components/ProductHighlight";
import ProductCarousel from "../components/ProductCarousel";
import PromoSection from "../components/PromoSection";
import FullWidthBanner from "../components/FullWidthBanner";
import SocialFeed from "../components/SocialFeed";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />

      {/* Sections separated by a visible blush-pink gap — paddingTop adds the gap after the hero too */}
      <div className="flex flex-col" style={{ gap: "56px", background: "#eddde0", paddingTop: "56px" }}>
        <FeatureSplit />
        <ProductHighlight />
        <ProductCarousel />
        <PromoSection />
        <FullWidthBanner />
        <SocialFeed />
        <Footer />
      </div>
    </main>
  );
}
