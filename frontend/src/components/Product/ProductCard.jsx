// src/components/Product/ProductCard.jsx

import useRating from "./product-rating/useRating";
import RatingStars from "./product-rating/RatingStars";
import RatingPopup from "./product-rating/RatingPopup";
import HoverActions from "./product-actions/HoverActions";

import "./product.css";

export default function ProductCard({ item }) {
  const rating = useRating(item);

  const imageUrl = item?.main_image
    ? `http://localhost:5000${item.main_image}`
    : "https://via.placeholder.com/300x300?text=No+Image";

  const price = Number(item?.price) || 0;
  const oldPrice = Number(item?.old_price) || 0;

  const showDiscount =
    item?.tag === "exclusive-offer" && oldPrice > price;

  return (
    <>
      {/* ================= PRODUCT CARD ================= */}
      <div className="product-card">
        <div className="product-img-box">
          <img
            src={imageUrl}
            className="product-img"
            alt={item?.name}
          />

          {/* Hover actions */}
          <HoverActions onRate={() => rating.setShowPopup(true)} />
        </div>

        {/* ================= PRODUCT INFO ================= */}
        <div className="product-info-row">
          <div className="product-info-left">
            <p className="product-name">{item?.name}</p>

            <div className="product-price-row">
              <span className="product-new-price">
                Rs. {price.toFixed(2)}
              </span>

              {showDiscount && (
                <span className="product-old-price">
                  Rs. {oldPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* ⭐ Rating display */}
          <RatingStars
            rating={rating.rating}
            ratingCount={rating.ratingCount}
            onOpen={() => rating.setShowPopup(true)}
          />
        </div>
      </div>

      {/* ================= RATING POPUP ================= */}
      {rating.showPopup && (
        <RatingPopup
          rating={rating.rating}
          hoverRate={rating.hoverRate}
          setHoverRate={rating.setHoverRate}
          onSubmit={rating.submitRating}
          onClose={() => rating.setShowPopup(false)}
        />
      )}

      {/* ================= TOAST MESSAGE ================= */}
      {rating.showToast && (
        <div className="toast-success">
          {rating.toastMessage}
        </div>
      )}
    </>
  );
}
