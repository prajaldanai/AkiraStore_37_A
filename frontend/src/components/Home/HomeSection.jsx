import React, { useEffect, useState, useCallback, useRef } from "react";
import ProductSlider from "../Product/ProductSlider";
import { useNavigate } from "react-router-dom";
import "./home.css";

export default function HomeSection({ title, subtitle, slug }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const eventSourceRef = useRef(null);

  /* ================= LOAD PRODUCTS ================= */
  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/user/products/latest/${slug}?limit=10`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("❌ Load products error:", error);
      setProducts([]);
    }
  }, [slug]);

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /* ================= SSE AUTO REFRESH ================= */
  useEffect(() => {
    // prevent duplicate connections
    if (eventSourceRef.current) return;

    const es = new EventSource(
      "http://localhost:5000/api/products/subscribe"
    );

    eventSourceRef.current = es;

    es.addEventListener("product-update", () => {
      console.log(`🔄 Product update received → ${slug}`);
      loadProducts();
    });

    es.onerror = (err) => {
      console.warn("⚠️ SSE connection issue", err);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [loadProducts, slug]);

  /* ================= UI LOGIC ================= */
  const hideViewButton = slug === "grocery" || slug === "glasses";

  return (
    <div className="category-section">
      <div className="section-header">
        <h2>{title}</h2>

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
