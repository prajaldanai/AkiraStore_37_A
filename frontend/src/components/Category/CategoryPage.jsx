import React, { useEffect, useState } from "react";
import "./style/categoryPage.css";

import HomeHeader from "../Home/HomeHeader";   // ⭐ HEADER AT TOP

import HeroSection from "./HeroSection";
import ProductsSection from "./ProductsSection";
import OfferSection from "./OfferSection";
import { CATEGORY_CONFIG } from "./config";

export default function CategoryPage({ slug }) {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ⭐ ALWAYS CALL HOOKS OUTSIDE CONDITIONS
  useEffect(() => {
    async function loadPage() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/user/products/category/${slug}`
        );

        const data = await res.json();
        console.log("🔥 RAW PRODUCTS:", data);

        let products = data.products || [];

        // ⭐ FIX IMAGE FORMAT
        products = products.map((p) => ({
          ...p,
          images: p.main_image ? [p.main_image] : [],
        }));

        console.log("🔥 FIXED PRODUCTS:", products);

        // ⭐ GROUP PRODUCTS
        const grouped = {
          bestSelling: products.filter((p) => p.tag === "best-selling"),
          newArrivals: products.filter((p) => p.tag === "new-arrival"),
          accessories: products.filter((p) => p.tag === "accessories"),
          exclusiveOffer:
            products.find((p) => p.tag === "exclusive-offer") || null,
        };

        console.log("🔥 GROUPED DATA:", grouped);

        setPageData(grouped);
      } catch (err) {
        console.log("❌ Category Page Load Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [slug]);

  // ⭐ SAFE RETURNS (NO HOOK ERRORS)
  if (loading) return <h2 className="loading">Loading...</h2>;
  if (!pageData) return <h2>No Data</h2>;

  const { bestSelling, newArrivals, accessories, exclusiveOffer } = pageData;
  const config = CATEGORY_CONFIG[slug];

  return (
    <div className="category-page">

      {/* ⭐ FIX GAP — HEADER ALWAYS FIRST */}
      <HomeHeader />

      {/* HERO SECTION */}
      <HeroSection config={config} />

      {/* BEST SELLING */}
      {bestSelling.length > 0 && (
        <ProductsSection title="Best Selling" products={bestSelling} />
      )}

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <ProductsSection title="New Arrivals" products={newArrivals} />
      )}

      {/* ACCESSORIES */}
      {accessories.length > 0 && (
        <ProductsSection title="Accessories" products={accessories} />
      )}

      {/* EXCLUSIVE OFFER */}
      {exclusiveOffer && (
        <OfferSection offer={exclusiveOffer} config={config} />
      )}
    </div>
  );
}
