import React from "react";
import "./style/products.css";

export default function ProductCard({ item }) {
  if (!item) return null;

  const backendURL = "http://localhost:5000";

  /* ===============================
     IMAGE
  =============================== */
  const img = item.main_image
    ? `${backendURL}${item.main_image}`
    : `${backendURL}/uploads/placeholder.png`;

  /* ===============================
     PRICE LOGIC (FINAL)
     - show old price for exclusive-offer
  =============================== */
  const price = Number(item.price);
  const oldPrice = Number(item.old_price);

  const isExclusiveOffer =
    item.tag === "exclusive-offer" &&
    !isNaN(oldPrice) &&
    oldPrice > 0;

  return (
    <div className="product-card">
      <div className="product-img-box">
        <img src={img} alt={item.name} className="product-img" />
      </div>

      <div className="product-info">
        <p className="product-name">{item.name}</p>

        <div className="product-price-row">
          {/* NEW PRICE */}
          <span className="product-new-price">
            Rs. {price.toFixed(2)}
          </span>

          {/* OLD PRICE (CUT) */}
          {isExclusiveOffer && (
            <span className="product-old-price">
              Rs. {oldPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
