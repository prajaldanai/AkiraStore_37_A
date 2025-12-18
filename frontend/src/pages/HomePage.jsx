import React from "react";
import HomeHeader from "../components/Home/HomeHeader";
import HeroSection from "../components/Home/HeroSection";
import HomeSection from "../components/Home/HomeSection";
import Footer from "../components/Home/Footer"; // ⭐ IMPORT FOOTER

export default function HomePage() {
  return (
    <div className="page-wrapper">
      <HomeHeader />
      <HeroSection />

      {/* MEN SECTION */}
      <HomeSection
        title="Men’s Latest"
        subtitle="Experience modern style with men’s latest premium clothing collection."
        slug="men"
      />

      {/* WOMEN SECTION */}
      <HomeSection
        title="Women’s Latest"
        subtitle="Explore premium and fashionable outfits designed for women."
        slug="women"
      />

      {/* KIDS SECTION */}
      <HomeSection
        title="Kids Latest"
        subtitle="Comfortable and stylish clothing tailored for young explorers."
        slug="kids"
      />

      {/* ELECTRONICS SECTION */}
      <HomeSection
        title="Electronic Product"
        subtitle="Smart, powerful and reliable — electronics designed for your lifestyle."
        slug="electronics"
      />

      {/* SHOES SECTION */}
      <HomeSection
        title="Shoes"
        subtitle="Premium shoes designed for comfort and style."
        slug="shoes"
      />

      {/* GLASSES SECTION */}
      <HomeSection
        title="Glasses & Eyewear"
        subtitle="Trendy, protective and stylish eyewear for daily use."
        slug="glasses"
      />

      {/* GROCERY SECTION */}
      <HomeSection
        title="Grocery & Essentials"
        subtitle="Daily essentials and fresh groceries delivered with quality you can trust."
        slug="grocery"
      />

      {/* ⭐ FOOTER ALWAYS AT BOTTOM */}
      <Footer />
    </div>
  );
}
