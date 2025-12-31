import React, { useEffect, useState } from "react";
import ProductSlider from "../Product/ProductSlider";

import ProductCard from "./ProductCard";
import styles from "./style/hero.module.css";

import "./style/products.css";

export default function ProductsSection({
  title,
  description,
  products = [],
  variant = "grid",
}) {
  const [visibleProducts, setVisibleProducts] = useState([]);

  /* ================= EXCLUSIVE EXPIRY FILTER ================= */
  useEffect(() => {
    if (!Array.isArray(products)) {
      setVisibleProducts([]);
      return;
    }

    const updateVisibleProducts = () => {
      const now = Date.now();

      const activeProducts = products.filter((p) => {
        // ✅ keep non-exclusive products always
        if (!p.exclusive_offer_end) return true;

        // ✅ hide expired exclusive products
        return new Date(p.exclusive_offer_end).getTime() > now;
      });

      setVisibleProducts(activeProducts);
    };

    updateVisibleProducts();

    // ⏱️ check expiry every second
    const interval = setInterval(updateVisibleProducts, 1000);

    return () => clearInterval(interval);
  }, [products]);

  /* ================= SAFETY CHECK ================= */
  if (!visibleProducts.length) return null;

  return (
    <section
      className={`products-section ${
        variant === "slider" ? "slider-section" : ""
      }`}
    >
      {/* HEADER */}
      <div className="figma-section-header">
        <h2 className="figma-section-title">{title}</h2>

        {description && (
          <p className="figma-section-description">{description}</p>
        )}
      </div>

      {/* CONTENT */}
      {variant === "slider" ? (
        <ProductSlider
          key={`${title}-${visibleProducts.length}`}
          items={visibleProducts}
        />
      ) : (
        <div className="products-grid">
          {visibleProducts.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}