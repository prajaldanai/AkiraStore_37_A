import React, { useEffect, useState, useCallback } from "react";
import ProductSlider from "./ProductSlider";
import { useNavigate } from "react-router-dom";
import "./home.css";

export default function HomeSection({ title, subtitle, slug }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/user/products/latest/${slug}?limit=10`
      );
      const data = await res.json();

      console.log("Loaded:", slug, data);

      if (data.success) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error(error);
      setProducts([]);
    }
  }, [slug]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // ⭐ Sections that should NOT show view button
  const hideViewButton = slug === "grocery" || slug === "glasses";

  return (
    <div className="category-section">
      <div className="section-header">
        <h2>{title}</h2>

        {/* ⭐ Hide view button for grocery + glasses */}
        {!hideViewButton && (
          <button
            className="view-btn"
            onClick={() => navigate(`/category/${slug}`)}
          >
            view
          </button>
        )}
      </div>

      <p className="section-subtitle">{subtitle}</p>

      <ProductSlider items={products} />
    </div>
  );
}
