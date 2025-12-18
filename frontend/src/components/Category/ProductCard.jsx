import React from "react";
import "./style/products.css";

export default function ProductCard({ item }) {
  if (!item) return null;

  // Fix image full path
  const backendURL = "http://localhost:5000"; 
  const img =
    item.images?.[0]
      ? `${backendURL}${item.images[0]}`
      : `${backendURL}/uploads/placeholder.png`;

  return (
    <div className="product-card">
      <div className="product-img-box">
        <img src={img} alt={item.name} className="product-img" />
      </div>

      <div className="product-info">
        <p className="product-name">{item.name}</p>
        <p className="product-price">Rs. {item.price}</p>
      </div>
    </div>
  );
}
