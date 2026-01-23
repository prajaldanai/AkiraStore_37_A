// src/components/Product/ProductCard.jsx
import { useMemo } from "react";
import useRating from "./product-rating/useRating";
import RatingStars from "./product-rating/RatingStars";
import RatingPopup from "./product-rating/RatingPopup";
import HoverActions from "./product-actions/HoverActions";

import "./product.css";

/**
 * ProductCard - Full rating interaction support
 */
export default function ProductCard({ item }) {
  // CRITICAL: productId must be a valid number or string ID
  // Priority: id (most common) > _id (MongoDB) > product_id > fallback to slug/name
  const productId = useMemo(() => {
    const id = item?.id ?? item?._id ?? item?.product_id;
    // Ensure we have a valid ID (not undefined, null, or empty)
    if (id !== undefined && id !== null && id !== "") {
      return id;
    }
    // Fallback to slug or name (less reliable)
    return item?.slug ?? item?.name ?? null;
  }, [item?.id, item?._id, item?.product_id, item?.slug, item?.name]);
  
  // Full rating hook with submit capability
  const rating = useRating({
    productId,
    initialAvg: Number(item?.avg_rating ?? item?.average_rating ?? item?.rating_avg) || 0,
    initialCount: Number(item?.rating_count ?? item?.total_ratings ?? item?.ratings_count) || 0,
  });

  const imageUrl = item?.main_image
    ? `http://localhost:5000${item.main_image}`
    : "https://via.placeholder.com/300x300?text=No+Image";

  const price = Number(item?.price) || 0;
  const oldPrice = Number(item?.old_price) || 0;
  const showDiscount = item?.tag === "exclusive-offer" && oldPrice > price;

  const discountPercent = useMemo(() => {
    if (!showDiscount) return 0;
    const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
    return pct > 0 ? pct : 0;
  }, [showDiscount, oldPrice, price]);

  return (
    <div className="product-card">
      {/* Rating Message Toast */}
      {rating.message?.text && (
        <div className={`product-toast ${rating.message.type}`}>
          <span className="product-toast-icon">
            {rating.message.type === "success" ? "★" : "ℹ"}
          </span>
          <span className="product-toast-text">{rating.message.text}</span>
          <button
            className="product-toast-close"
            type="button"
            onClick={rating.clearMessage}
            aria-label="Close message"
          >
            ✕
          </button>
        </div>
      )}

      {/* IMAGE BOX */}
      <div className="product-img-box">
        <img src={imageUrl} className="product-img" alt={item?.name || "Product"} />

        {/* Discount tag */}
        {showDiscount && discountPercent > 0 ? (
          <div className="product-badge">-{discountPercent}%</div>
        ) : null}

        {/* Hover actions - View, Rate, Cart */}
        <HoverActions 
          productId={productId}
          onRate={rating.openRate}
        />

        {/* Rating Popup */}
        {rating.showPopup && (
          <RatingPopup
            title="Rate this Product"
            value={rating.tempValue}
            hoverValue={rating.hoverValue}
            onHover={rating.setHoverValue}
            onChange={rating.setTempValue}
            onSubmit={rating.submitRating}
            onClose={rating.closePopup}
            loading={rating.loading}
            isUpdate={rating.hasRated}
          />
        )}
      </div>

      {/* INFO AREA */}
      <div className="product-info">
        <div className="product-title-row">
          <h3 className="product-title">{item?.name || "Untitled product"}</h3>

          {/* Rating display */}
          <div className="product-rating-summary">
            <RatingStars value={rating.avg} readOnly />
            <span className="product-rating-count">
              ({rating.count} {rating.count === 1 ? "rating" : "ratings"})
            </span>
            {rating.hasRated && (
              <div className="product-your-rating">Your rating: {rating.userRating}★</div>
            )}
          </div>
        </div>

        <div className="product-price-row">
          <span className="product-price-now">Rs. {price.toFixed(2)}</span>
          {showDiscount && (
            <span className="product-old-price">Rs. {oldPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

