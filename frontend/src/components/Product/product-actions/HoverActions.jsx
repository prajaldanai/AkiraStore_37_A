import { useNavigate } from "react-router-dom";
import { useState } from "react";

import eye from "../../../assets/icons/eye.png";
import star from "../../../assets/icons/star.png";
import cart from "../../../assets/icons/cart.png";

/**
 * HoverActions - Product card hover overlay
 * 
 * Actions:
 * - View: Navigate to product detail page
 * - Rate: Open rating modal
 * - Cart: Add to cart with visual feedback
 * 
 * CRITICAL FIX FOR PAGE RELOAD:
 * All click handlers must call both:
 * - event.preventDefault() - stops default browser behavior
 * - event.stopPropagation() - stops event bubbling to parent elements
 * 
 * Without these, clicks can bubble up and trigger unwanted navigation or reload.
 */
export default function HoverActions({ productId, onRate, onCart }) {
  const navigate = useNavigate();
  const [cartClicked, setCartClicked] = useState(false);

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
     ADD TO CART
     - Adds item to cart with visual feedback
     - Shows brief animation on click
  =============================== */
  const handleCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Visual feedback - brief click animation
    setCartClicked(true);
    setTimeout(() => setCartClicked(false), 200);
    
    if (typeof onCart === "function") {
      onCart();
    }
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
        className={`hover-icon-box ${cartClicked ? 'cart-clicked' : ''}`}
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
