import React from "react";
import ProductCard from "./ProductCard";
import "./style/products.css";

export default function ProductsSection({ title, products }) {
  if (!products || products.length === 0) {
    return null; // hide empty sections
  }

  return (
    <div className="products-section">
      <h2 className="section-title">{title}</h2>

      <div className="products-grid">
        {products.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
