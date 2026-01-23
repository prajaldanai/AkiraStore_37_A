import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProductInfo.module.css";
import useRating from "../../Product/product-rating/useRating";
import RatingPopup from "../../Product/product-rating/RatingPopup";
import useCartAction from "../../Product/product-actions/useCartAction";
import { createBuyNowSession } from "../../../services/buyNowService";


function getStockStatus(stock) {
  const s = Number(stock) || 0;
  if (s > 5) return { status: "In Stock", color: "inStock", canPurchase: true };
  if (s > 0) return { status: "Low Stock", color: "lowStock", canPurchase: true };
  return { status: "Out of Stock", color: "outOfStock", canPurchase: false };
}

function renderStars(avgRating) {
  const rating = Math.round(Number(avgRating) || 0);
  const filled = Math.min(5, Math.max(0, rating));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}


function parseSizes(sizes) {
  // Guard: handle null, undefined, empty
  if (sizes === null || sizes === undefined || sizes === "") {
    return [];
  }

  let rawArray = [];

  // Case 1: Already an array
  if (Array.isArray(sizes)) {
    rawArray = sizes;
  }
  // Case 2: Comma-separated string
  else if (typeof sizes === "string") {
    rawArray = sizes.split(",");
  }
  // Case 3: Single number (edge case)
  else if (typeof sizes === "number" && !Number.isNaN(sizes)) {
    return [String(sizes)];
  }
  // Case 4: Unknown format
  else {
    return [];
  }

  // Process each value safely
  return rawArray
    .map((item) => {
      // Skip null, undefined
      if (item === null || item === undefined) {
        return null;
      }
      // Convert numbers to string
      if (typeof item === "number") {
        return Number.isNaN(item) ? null : String(item).trim();
      }
      // Handle strings
      if (typeof item === "string") {
        const trimmed = item.trim();
        // Filter out "null", "undefined", empty strings
        if (trimmed === "" || trimmed === "null" || trimmed === "undefined") {
          return null;
        }
        return trimmed;
      }
      // Any other type - skip
      return null;
    })
    .filter((item) => item !== null); // Remove all nulls
}

/**
 * Parse stock safely - always returns a number
 */
function parseStock(stock) {
  if (stock === null || stock === undefined || stock === "") {
    return 0;
  }
  const parsed = Number(stock);
  return Number.isNaN(parsed) ? 0 : Math.max(0, Math.floor(parsed));
}

export default function ProductInfo({
  productId,
  name = "",
  price = 0,
  old_price,
  avg_rating = 0,
  rating_count = 0,
  sizes = [],
  stock = 0,
  image = "",
}) {
  const navigate = useNavigate();

  // Use the rating hook for interactive rating
  const rating = useRating({
    productId,
    initialAvg: Number(avg_rating) || 0,
    initialCount: Number(rating_count) || 0,
  });

  const {
    addToCart,
    message: cartMessage,
    clearMessage: clearCartMessage,
  } = useCartAction();

  // Parse admin data safely - ONCE at the top
  const parsedPrice = Number(price) || 0;
  const parsedOldPrice = old_price ? Number(old_price) : null;
  const parsedStock = parseStock(stock); // Use safe parser
  const parsedSizes = useMemo(() => parseSizes(sizes), [sizes]);
  const hasSizes = parsedSizes.length > 0;

  // Stock status computation
  const stockInfo = getStockStatus(parsedStock);

  // State
  const [qty, setQty] = useState(1);
  const [selectedSizes, setSelectedSizes] = useState([]); // Array for multi-size selection
  const [sizeWarning, setSizeWarning] = useState(""); // Warning message for size limit
  const [buyNowLoading, setBuyNowLoading] = useState(false); // Buy Now button loading state

  // Auto-trim selectedSizes when quantity decreases
  useEffect(() => {
    if (selectedSizes.length > qty) {
      // Trim to match new quantity (keep first N sizes)
      setSelectedSizes((prev) => prev.slice(0, qty));
      setSizeWarning(`Reduced to ${qty} size${qty > 1 ? "s" : ""} to match quantity.`);
      // Clear warning after 3 seconds
      const timer = setTimeout(() => setSizeWarning(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [qty, selectedSizes.length]);

  // Handle size toggle
  const handleSizeToggle = (size) => {
    // Clear any previous warning
    setSizeWarning("");

    // Check if already selected - toggle off
    if (selectedSizes.includes(size)) {
      setSelectedSizes((prev) => prev.filter((s) => s !== size));
      return;
    }

    // Check if at limit
    if (selectedSizes.length >= qty) {
      setSizeWarning(`You can only select ${qty} size${qty > 1 ? "s" : ""} for quantity ${qty}.`);
      // Clear warning after 3 seconds
      setTimeout(() => setSizeWarning(""), 3000);
      return;
    }

    // Add the size
    setSelectedSizes((prev) => [...prev, size]);
  };

  // Handle Buy Now click - creates session and navigates to checkout
  const handleBuyNow = async () => {
    if (!canBuy || buyNowLoading) return;

    try {
      setBuyNowLoading(true);
      const result = await createBuyNowSession({
        productId,
        selectedSize: selectedSizes,
        quantity: qty,
      });

      if (result.success && result.sessionId) {
        navigate(`/buy-now/${result.sessionId}`);
      } else {
        alert(result.message || "Failed to start checkout");
      }
    } catch (error) {
      console.error("Buy Now error:", error);
      alert(error.message || "Failed to start checkout. Please try again.");
    } finally {
      setBuyNowLoading(false);
    }
  };

  // Computed values
  const totalPrice = parsedPrice * qty;
  
  // Can only buy if: has stock AND (has no sizes OR at least one size is selected)
  const canBuy = stockInfo.canPurchase && (!hasSizes || selectedSizes.length > 0);

  const handleAddToCart = () => {
    if (!canBuy) return;
    addToCart(
      {
        id: productId,
        name,
        price: parsedPrice,
        main_image: image,
      },
      {
        quantity: qty,
        selectedSizes,
        price: parsedPrice,
      }
    );
  };

  // Quantity handlers
  const handleDecrement = () => {
    if (qty > 1) setQty(qty - 1);
  };

  const handleIncrement = () => {
    if (qty < parsedStock) setQty(qty + 1);
  };

  return (
    <div className={styles.container}>
      {/* Rating Message Toast */}
      {rating.message?.text && (
        <div className={`${styles.ratingToast} ${styles[rating.message.type] || ""}`}>
          <span>{rating.message.type === "success" ? "★" : "ℹ"}</span>
          <span>{rating.message.text}</span>
          <button 
            type="button" 
            onClick={rating.clearMessage}
            className={styles.toastClose}
            aria-label="Close message"
          >
            ✕
          </button>
        </div>
      )}

      {/* Rating Section - Interactive */}
      <div className={styles.ratingRow}>
        <div className={styles.ratingDisplay}>
          <span className={styles.stars}>{renderStars(rating.avg)}</span>
          <span className={styles.ratingText}>
            {rating.count > 0
              ? `${Number(rating.avg).toFixed(1)} (${rating.count} ratings)`
              : "No ratings yet"}
          </span>
        </div>
        <div className={styles.ratingActions}>
          <button 
            type="button" 
            className={styles.rateButton}
            onClick={rating.openRate}
          >
            {rating.hasRated ? "Update Rating" : "Rate Product"}
          </button>
          {rating.hasRated && (
            <span className={styles.yourRating}>Your rating: {rating.userRating}★</span>
          )}
        </div>
      </div>

      {cartMessage?.text && (
        <div className={`${styles.cartMessage} ${styles[cartMessage.type] || ""}`}>
          <span>{cartMessage.text}</span>
          <button
            type="button"
            className={styles.cartMessageClose}
            onClick={clearCartMessage}
            aria-label="Close cart message"
          >
            âœ•
          </button>
        </div>
      )}

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

      {/* Title */}
      <h1 className={styles.title}>{name || "Untitled Product"}</h1>

      {/* Price Section */}
      <div className={styles.priceSection}>
        <div className={styles.priceRow}>
          <span className={styles.price}>Rs. {totalPrice.toLocaleString()}</span>
          {parsedOldPrice && parsedOldPrice > parsedPrice && (
            <span className={styles.oldPrice}>Rs. {parsedOldPrice.toLocaleString()}</span>
          )}
        </div>
        {qty > 1 && (
          <div className={styles.unitPrice}>
            Rs. {parsedPrice.toLocaleString()} per unit × {qty}
          </div>
        )}
      </div>
      <div className={styles.taxNote}>Inclusive of all taxes</div>

      {/* Size Selection - Only show if admin entered sizes */}
      {hasSizes ? (
        <div className={styles.sizeSection}>
          <span className={styles.sizeLabel}>
            Size <span className={styles.required}>*</span>
            {qty > 1 && (
              <span className={styles.sizeLimit}>
                {" "}(select up to {qty})
              </span>
            )}
          </span>
          <div className={styles.sizeList}>
            {parsedSizes.map((s, index) => {
              const isSelected = selectedSizes.includes(s);
              const isAtLimit = selectedSizes.length >= qty && !isSelected;
              return (
                <button
                  key={`${s}-${index}`}
                  type="button"
                  className={`${styles.sizeButton} ${isSelected ? styles.sizeButtonActive : ""} ${isAtLimit ? styles.sizeButtonLimited : ""}`}
                  onClick={() => handleSizeToggle(s)}
                  disabled={!stockInfo.canPurchase}
                  aria-pressed={isSelected}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {/* Selected sizes display */}
          {selectedSizes.length > 0 && (
            <div className={styles.selectedSizesDisplay}>
              Selected: {selectedSizes.join(", ")}
            </div>
          )}
          {/* Warning message */}
          {sizeWarning && (
            <div className={styles.sizeWarning}>{sizeWarning}</div>
          )}
          {/* Hint when no size selected */}
          {selectedSizes.length === 0 && stockInfo.canPurchase && !sizeWarning && (
            <div className={styles.sizeHint}>Please select {qty > 1 ? `up to ${qty} sizes` : "a size"}</div>
          )}
        </div>
      ) : null}

      {/* Quantity Section - Only show if stock > 0 */}
      {stockInfo.canPurchase && (
        <div className={styles.quantitySection}>
          <div className={styles.quantityRow}>
            <span className={styles.quantityLabel}>Quantity</span>
            <div className={styles.quantityControl}>
              <button
                type="button"
                className={styles.qtyButton}
                onClick={handleDecrement}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
            >
              −
            </button>
            <span className={styles.qtyValue}>{qty}</span>
            <button
              type="button"
              className={styles.qtyButton}
              onClick={handleIncrement}
              disabled={qty >= parsedStock}
              aria-label="Increase quantity"
            >
              +
            </button>
            </div>
          </div>
          {/* Availability Row */}
          <div className={styles.availabilityRow}>
            <span className={styles.availabilityLabel}>Availability:</span>
            <span className={styles.stockNumber}>{parsedStock}</span>
            <span className={styles.stockText}>available</span>
            <span className={styles.stockStatus}>(in stock)</span>
          </div>
        </div>
      )}

      {/* Stock Warning for Low Stock */}
      {stockInfo.status === "Low Stock" && (
        <div className={styles.stockWarning}>
          ⚠️ Only {parsedStock} item{parsedStock > 1 ? "s" : ""} left in stock!
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button
          type="button"
          className={styles.addToCart}
          onClick={handleAddToCart}
          disabled={!canBuy}
          title={
            !stockInfo.canPurchase
              ? "Out of stock"
              : hasSizes && selectedSizes.length === 0
              ? "Please select at least one size"
              : ""
          }
        >
          Add to Cart
        </button>
        <button
          type="button"
          className={styles.buyNow}
          disabled={!canBuy || buyNowLoading}
          onClick={handleBuyNow}
          title={
            !stockInfo.canPurchase
              ? "Out of stock"
              : hasSizes && selectedSizes.length === 0
              ? "Please select at least one size"
              : ""
          }
        >
          {buyNowLoading ? "Loading..." : "Buy Now"}
        </button>
      </div>

      {/* Why Choose Us */}
      <div className={styles.whyChoose}>
        <div className={styles.whyTitle}>Why Choose Us?</div>
        <div className={styles.whyList}>
          <div className={styles.whyItem}>🚚Fast Delivery</div>
          <div className={styles.whyItem}>🔒 Secure Payment</div>
          <div className={styles.whyItem}>💰 Money-Back Guarantee</div>
          <div className={styles.whyItem}>💵 Cash on Delivery</div>
        </div>
      </div>
    </div>
  );
}
