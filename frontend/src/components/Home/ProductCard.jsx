// src/components/Home/ProductCard.jsx
import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./home.css";

import eye from "../../assets/icons/eye.png";
import starIcon from "../../assets/icons/star.png";
import cart from "../../assets/icons/cart.png";

export default function ProductCard({ item }) {
  // Initialize rating safely from item
  const [rating, setRating] = useState(() => Number(item?.avg_rating || 0));
  const [ratingCount, setRatingCount] = useState(() =>
    Number(item?.rating_count || 0)
  );

  const [showPopup, setShowPopup] = useState(false);
  const [hoverRate, setHoverRate] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const imageUrl = item?.main_image
    ? `http://localhost:5000${item.main_image}`
    : "https://via.placeholder.com/300x300?text=No+Image";

  /* =====================================================
        SUBMIT RATING
  ===================================================== */
  const submitRating = async (value) => {
    // Close popup immediately for snappy UX
    setShowPopup(false);

    // Show toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);

    try {
      const res = await fetch("http://localhost:5000/api/rating/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: item.id,
          rating: value,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setRating(Number(data.newAverage));
        setRatingCount(Number(data.totalRatings));
      }
    } catch (err) {
      console.log("Rating error:", err);
    }
  };

  return (
    <>
      {/* =====================================================
            PRODUCT CARD
      ===================================================== */}
      <div className="product-card">
        <div className="product-img-box">
          <img src={imageUrl} className="product-img" alt={item?.name} />

          {/* Hover Actions */}
          <div className="center-hover-icons">
            <div className="hover-icon-box">
              <img src={eye} className="hover-icon" alt="view" />
            </div>

            <div
              className="hover-icon-box"
              onClick={() => setShowPopup(true)}
            >
              <img src={starIcon} className="hover-icon" alt="rate" />
            </div>

            <div className="hover-icon-box">
              <img src={cart} className="hover-icon" alt="cart" />
            </div>
          </div>
        </div>

        {/* PRODUCT INFO */}
        <div className="product-info-row">
          <div>
            <p className="product-name">{item?.name}</p>
            <p className="product-price">Rs. {item?.price}</p>
          </div>

          {/* RIGHT SIDE RATING (DISPLAY ONLY) */}
          <div className="rating-block" onClick={() => setShowPopup(true)}>
            <div className="rating-right">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={i + 1 <= Math.round(rating) ? "star filled" : "star"}
                >
                  ★
                </span>
              ))}
            </div>
            <p className="rating-count">({ratingCount} people rated)</p>
          </div>
        </div>
      </div>

      {/* =====================================================
              RATING POPUP
      ===================================================== */}
      {showPopup &&
        ReactDOM.createPortal(
          <div className="rating-popup">
            <div className="rating-popup-box">
              <h2 className="rating-title">Rate this Product</h2>

              <div className="rating-popup-stars">
                {Array.from({ length: 5 }).map((_, i) => {
                  const num = i + 1;
                  const filled = num <= (hoverRate || rating);

                  return (
                    <span
                      key={i}
                      className={`rating-star ${
                        filled ? "filled" : "empty"
                      }`}
                      onMouseEnter={() => setHoverRate(num)}
                      onMouseLeave={() => setHoverRate(0)}
                      onClick={() => submitRating(num)}
                    >
                      ★
                    </span>
                  );
                })}
              </div>

              <button
                className="rating-close-btn"
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
            </div>
          </div>,
          document.getElementById("popup-root")
        )}

      {/* =====================================================
              TOAST MESSAGE
      ===================================================== */}
      {showToast &&
        ReactDOM.createPortal(
          <div className="toast-success">⭐ Thanks for rating!</div>,
          document.getElementById("popup-root")
        )}
    </>
  );
}
