import { useNavigate } from "react-router-dom";

import eye from "../../../assets/icons/eye.png";
import star from "../../../assets/icons/star.png";
import cart from "../../../assets/icons/cart.png";

/**
 * HoverActions - Product card hover overlay
 * 
 * Actions:
 * - View: Navigate to product detail page
 * - Rate: Open rating modal
 * - Cart: Add to cart (future)
 * 
 * CRITICAL FIX FOR PAGE RELOAD:
 * All click handlers must call both:
 * - event.preventDefault() - stops default browser behavior
 * - event.stopPropagation() - stops event bubbling to parent elements
 * 
 * Without these, clicks can bubble up and trigger unwanted navigation or reload.
 */
export default function HoverActions({ productId, onRate }) {
  const navigate = useNavigate();

  /* ===============================
     VIEW PRODUCT
     - Navigates to product detail page
     - Stops event from bubbling to parent card
  =============================== */
  const handleView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${productId}`);
  };

  /* ===============================
     RATE PRODUCT  
     - Opens rating popup
     - MUST stop propagation to prevent parent handlers
  =============================== */
  const handleRate = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRate) onRate();
  };

  /* ===============================
     ADD TO CART (placeholder)
  =============================== */
  const handleCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement cart functionality
  };

  return (
    <div 
      className="center-hover-icons"
      onClick={(e) => e.stopPropagation()} // Extra safety: catch any bubbling clicks
    >
      {/* 👁 View */}
      <div
        className="hover-icon-box"
        onClick={handleView}
        role="button"
        tabIndex={0}
        aria-label="View product"
      >
        <img src={eye} alt="View" className="hover-icon" />
      </div>

      {/* ⭐ Rate */}
      <div
        className="hover-icon-box"
        onClick={handleRate}
        role="button"
        tabIndex={0}
        aria-label="Rate product"
      >
        <img src={star} alt="Rate" className="hover-icon" />
      </div>

      {/* 🛒 Add to cart */}
      <div 
        className="hover-icon-box"
        onClick={handleCart}
        role="button"
        tabIndex={0}
        aria-label="Add to cart"
      >
        <img src={cart} alt="Add to cart" className="hover-icon" />
      </div>
    </div>
  );
}
