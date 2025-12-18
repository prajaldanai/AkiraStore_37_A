// src/components/Home/ProductCard.jsx
import React from "react";
import "../../components/Home/home.css"; // ensure path is correct
import { useNavigate } from "react-router-dom";

function ProductCard({ product, onQuickView }) {
  const navigate = useNavigate();

  const {
    id,
    name,
    price,
    old_price,
    rating,
    rating_count,
    image, // main image from backend
  } = product;

  const displayPrice = price ? Number(price).toFixed(2) : "0.00";
  const oldPriceDisplay =
    old_price !== null && old_price !== undefined
      ? Number(old_price).toFixed(2)
      : null;

  const stars = Math.round(Number(rating || 0));
  const maxStars = 5;

  const handleViewClick = () => {
    // go to category page or product page later
    if (onQuickView) {
      onQuickView(product);
    } else {
      navigate(`/product/${id}`);
    }
  };

  return (
    <div className="latest-card">
      <div className="latest-card-image-wrapper">
        <img
          src={image}
          alt={name}
          className="latest-card-image"
        />

        <div className="latest-card-hover-icons">
          <button
            type="button"
            className="latest-icon-btn"
            onClick={handleViewClick}
          >
            👁
          </button>
          <button type="button" className="latest-icon-btn">
            ★
          </button>
          <button type="button" className="latest-icon-btn">
            🛒
          </button>
        </div>
      </div>

      <div className="latest-card-info">
        <h4 className="latest-card-title">{name}</h4>

        <div className="latest-card-rating-row">
          <div className="latest-card-stars">
            {Array.from({ length: maxStars }).map((_, idx) => (
              <span
                key={idx}
                className={
                  idx < stars
                    ? "latest-star latest-star-filled"
                    : "latest-star"
                }
              >
                ★
              </span>
            ))}
          </div>
          {rating_count > 0 && (
            <span className="latest-card-rating-count">
              ({rating_count})
            </span>
          )}
        </div>

        <div className="latest-card-price-row">
          <span className="latest-price">Rs.{displayPrice}</span>
          {oldPriceDisplay && (
            <span className="latest-old-price">Rs.{oldPriceDisplay}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
