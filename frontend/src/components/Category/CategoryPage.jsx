import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import "./style/categoryPage.css";

import Layout from "../Layout/Layout";
import HeroSection from "./HeroSection";
import ProductsSection from "./ProductsSection";
import OfferSection from "./OfferSection";
import { CATEGORY_CONFIG } from "./config";

export default function CategoryPage({ slug: propSlug }) {
  const params = useParams();
  const slug = propSlug || params.slug;

  const [products, setProducts] = useState([]);
  const [exclusiveOffers, setExclusiveOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD DATA ================= */
  const loadData = useCallback(async () => {
    if (!slug) return;

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:5000/api/user/products/category/${slug}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      const normalized = (data.products || []).map((p) => ({
        ...p,
        images: p.main_image ? [p.main_image] : [],
      }));

      setProducts(normalized);
    } catch (err) {
      console.error("Category load error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  /* ================= INITIAL LOAD + SSE ================= */
  useEffect(() => {
    loadData();

    const evtSource = new EventSource(
      "http://localhost:5000/api/products/subscribe"
    );

    evtSource.addEventListener("product-update", () => {
      console.log("🔔 SSE update → refreshing category:", slug);
      loadData();
    });

    evtSource.onerror = (err) => {
      console.error("❌ SSE error (category page):", err);
    };

    return () => evtSource.close();
  }, [loadData, slug]);

  /* ================= UI ================= */
  if (loading) return <h2 className="loading">Loading...</h2>;

  const config = CATEGORY_CONFIG[slug];
  if (!config) {
    return (
      <Layout>
        <h2 className="loading">Category not found</h2>
      </Layout>
    );
  }

  const bestSelling = products.filter((p) => p.tag === "best-selling");
  const newArrivals = products.filter((p) => p.tag === "new-arrival");
  const accessories = products.filter((p) => p.tag === "accessories");

  const pageClass = `category-page ${
    slug ? `${slug}-page ${slug}-category-page` : "category-page-default"
  }`;

  return (
    <Layout>
      <div className={pageClass}>
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

        <OfferSection category={slug} onOffersLoaded={setExclusiveOffers} />

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
