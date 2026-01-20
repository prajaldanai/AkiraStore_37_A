import React from "react";
import Layout from "../components/Layout/Layout";
import HeroSection from "../components/Home/HeroSection";
import HomeSection from "../components/Home/HomeSection";
import useGlobalSSE from "../hooks/useGlobalSSE"; // 🔥 GLOBAL SSE (ONE CONNECTION)
import "./HomePage.css";

export default function HomePage() {
  // 🔥 Creates ONE SSE connection for the entire Home page
  useGlobalSSE();

  return (
    <Layout>
      <div className="home-page">
        <HeroSection />

        <HomeSection
          title="Men’s Latest"
          subtitle="Experience modern style with men’s latest premium clothing collection."
          slug="men"
        />

        <HomeSection
          title="Women’s Latest"
          subtitle="Explore premium and fashionable outfits designed for women."
          slug="women"
        />

        <HomeSection
          title="Kids Latest"
          subtitle="Comfortable and stylish clothing tailored for young explorers."
          slug="kids"
        />

        <HomeSection
          title="Electronic Product"
          subtitle="Smart, powerful and reliable — electronics designed for your lifestyle."
          slug="electronics"
        />

        <HomeSection
          title="Shoes"
          subtitle="Premium shoes designed for comfort and style."
          slug="shoes"
        />

        <HomeSection
          title="Glasses & Eyewear"
          subtitle="Trendy, protective and stylish eyewear for daily use."
          slug="glasses"
        />

        <HomeSection
          title="Grocery & Essentials"
          subtitle="Daily essentials and fresh groceries delivered with quality you can trust."
          slug="grocery"
        />
      </div>
    </Layout>
  );
}
