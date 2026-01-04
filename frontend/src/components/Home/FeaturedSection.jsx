import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


import ProductCard from "./ProductCard";

export default function FeaturedSection({ title, subtitle, categorySlug }) {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  // Fetch latest products for this category
  const fetchProducts = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API}/products/latest/${categorySlug}`
      );

      const data = await res.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categorySlug]);

  return (
    <section className="featured-section">

      {/* Title Row */}
      <div className="featured-header">
        <div>
          <h2>{title}</h2>
          <p className="featured-subtitle">{subtitle}</p>
        </div>

        <button 
          className="view-btn"
          onClick={() => navigate(`/category/${categorySlug}`)}
        >
          View
        </button>
      </div>

      {/* Products */}
      <div className="featured-grid">
        {products.length === 0 ? (
          <p>Loading...</p>
        ) : (
          products.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))
        )}
      </div>
    </section>
  );
}
