import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./style/categoryPage.css";

import Layout from "../Layout/Layout";
import HeroSection from "./HeroSection";
import ProductsSection from "./ProductsSection";
import OfferSection from "./OfferSection";
import { CATEGORY_CONFIG } from "./config";

export default function CategoryPage() {
  const { slug } = useParams();

  const [products, setProducts] = useState([]);
  const [exclusiveOffers, setExclusiveOffers] = useState([]); // ✅ ADD
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add("women-page-body");
    return () => {
      document.body.classList.remove("women-page-body");
    };
  }, []);

  useEffect(() => {
    if (!slug) return;

    async function loadData() {
      try {
        setLoading(true);

        const res = await fetch(
          `http://localhost:5000/api/user/products/category/${slug}`
        );
        const data = await res.json();

        const normalizedProducts = (data.products || []).map(p => ({
          ...p,
          images: p.main_image ? [p.main_image] : [],
        }));

        setProducts(normalizedProducts);
      } catch (err) {
        console.error("Category Page Load Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug]);

  if (loading) return <h2 className="loading">Loading...</h2>;

  const config = CATEGORY_CONFIG[slug];
  if (!config) {
    return (
      <Layout>
        <h2 className="loading">Category not found</h2>
      </Layout>
    );
  }

  const bestSelling = products.filter(p => p.tag === "best-selling");
  const newArrivals = products.filter(p => p.tag === "new-arrival");
  const accessories = products.filter(p => p.tag === "accessories");

  return (
    <Layout>
      <div className="category-page women-page women-category-page">
        <HeroSection config={config} />

        {bestSelling.length > 0 && (
          <ProductsSection
            title="Best Selling"
            description="Get in on the trend with our curated selection of the best selling styles."
            products={bestSelling}
            variant="slider"
          />
        )}

        {newArrivals.length > 0 && (
          <ProductsSection
            title="New Arrivals"
            description="Discover the latest arrivals and stay ahead with fresh new fashion picks."
            products={newArrivals}
            variant="slider"
          />
        )}

        {accessories.length > 0 && (
          <ProductsSection
            title="Accessories"
            description="Complete your look with must-have accessories designed to elevate your style."
            products={accessories}
            variant="slider"
          />
        )}

        {/* ✅ Banner + countdown */}
        <OfferSection
          category={slug}
          onOffersLoaded={setExclusiveOffers}
        />

        {/* ✅ Product cards (only when offers exist) */}
        {exclusiveOffers.length > 0 && (
          <ProductsSection
            title="Exclusive Offers"
            description="Limited-time deals available until the offer ends"
            products={exclusiveOffers}
            variant="slider"
          />
        )}
      </div>
    </Layout>
  );
}