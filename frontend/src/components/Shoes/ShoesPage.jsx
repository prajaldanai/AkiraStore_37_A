import React, { useEffect, useState } from "react";
import Layout from "../Layout/Layout";
import ProductsSection from "../Category/ProductsSection";
import OfferSection from "../Category/OfferSection";

export default function ShoesPage() {
  const [products, setProducts] = useState([]);
  const [exclusiveOffers, setExclusiveOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShoes() {
      try {
        setLoading(true);

        const res = await fetch(
          "http://localhost:5000/api/user/products/category/shoes"
        );
        const data = await res.json();

        const normalized = (data.products || []).map(p => ({
          ...p,
          images: p.main_image ? [p.main_image] : [],
        }));

        setProducts(normalized);
      } catch (err) {
        console.error("Shoes Page Load Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadShoes();
  }, []);

  if (loading) {
    return (
      <Layout>
        <h2 className="loading">Loading...</h2>
      </Layout>
    );
  }

  // SAME TAG LOGIC AS CATEGORY PAGE
  const bestSelling = products.filter(p => p.tag === "best-selling");
  const newArrivals = products.filter(p => p.tag === "new-arrival");
  const accessories = products.filter(p => p.tag === "accessories");

  return (
    <Layout>
      <div className="category-page">

        {bestSelling.length > 0 && (
          <ProductsSection
            title="Best Selling Shoes"
            description="Most purchased shoes chosen by customers."
            products={bestSelling}
            variant="slider"
          />
        )}

        {newArrivals.length > 0 && (
          <ProductsSection
            title="New Arrivals"
            description="Latest shoes recently added to our collection."
            products={newArrivals}
            variant="slider"
          />
        )}

        {accessories.length > 0 && (
          <ProductsSection
            title="Accessories"
            description="Shoe accessories to complete your look."
            products={accessories}
            variant="slider"
          />
        )}

        {/* ✅ OLD DESIGN LOGIC, NO IMAGE FOR SHOES */}
        <OfferSection
          category="shoes"
          showImage={false}          // THIS IS THE ONLY ADDITION
          onOffersLoaded={setExclusiveOffers}
        />

        {/* ✅ EXCLUSIVE OFFER PRODUCTS (SAME AS OTHERS) */}
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
