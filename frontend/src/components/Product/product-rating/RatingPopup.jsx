// src/components/Product/product-rating/RatingPopup.jsx
/**
 * RatingPopup - Modal for submitting product ratings
 * 
 * Uses LOCAL submitting state to avoid triggering parent re-renders
 * that could cause Swiper to rebuild slides on Home page.
 */
import { useEffect, useState } from "react";
import RatingStars from "./RatingStars";

export default function RatingPopup({
  title = "Rate this Product",
  value,
  hoverValue,
  onHover,
  onChange,
  onSubmit,
  onClose,
  loading = false, // Keep for backwards compatibility but prefer local state
  isUpdate = false,
}) {
  // LOCAL submitting state - doesn't trigger parent re-renders
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Combined loading state (external OR local)
  const isLoading = loading || isSubmitting;

  // 🔍 DEBUG: Track mount/unmount
  useEffect(() => {
    console.log("🟢 [RatingPopup] MOUNTED");
    return () => {
      console.log("🔴 [RatingPopup] UNMOUNTED - popup state will be LOST");
    };
  }, []);

  /**
   * Handle submit button click
   */
const handleSubmit = async (event) => {
  event.preventDefault();
  event.stopPropagation();
  event.nativeEvent?.stopImmediatePropagation?.();

  if (!onSubmit || isLoading) return;

  setIsSubmitting(true);

  try {
    await onSubmit(); // ✅ wait for completion
  } catch (err) {
    // submission failed — popup stays open
  } finally {
    setIsSubmitting(false); // ✅ ALWAYS reset
  }
};


  /**
   * Handle close button click
   */
  const handleClose = (event) => {
    console.log("🔵 [RatingPopup] Close button clicked");
    event.preventDefault();
    event.stopPropagation();
    console.log("🔵 [RatingPopup] onClose exists:", !!onClose);
    if (onClose) {
      console.log("🔵 [RatingPopup] Calling onClose()");
      onClose();
    }
  };

  /**
   * Handle backdrop click to close
   */
  const handleBackdropClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    // Allow close even during submission - user can cancel
    if (onClose) {
      onClose();
    }
  };

  /**
   * Handle clicks inside the popup content
   */
  const handlePopupClick = (event) => {
    event.stopPropagation();
  };

  return (
    <div 
      className="rating-popup-wrap" 
      role="dialog" 
      aria-modal="true"
      onClick={handleBackdropClick} // Click anywhere outside closes
    >
      {/* Invisible backdrop - clicking it closes the popup */}
      <div
        className="rating-popup-backdrop"
        aria-hidden="true"
      />

      {/* Popup content - clicks inside don't bubble to backdrop */}
      <div className="rating-popup" onClick={handlePopupClick}>
        <h4 className="rating-popup-title">
          {isUpdate ? "Update Your Rating" : title}
        </h4>

        <RatingStars
          value={value}
          hoverValue={hoverValue}
          onHover={onHover}
          onChange={onChange}
          size={28}
        />

        <div className="rating-popup-actions">
          <button 
            type="button" 
            className="rating-btn rating-btn-secondary" 
            onClick={handleClose}
          >
            Close
          </button>
          <button 
            type="button" 
            className="rating-btn rating-btn-primary" 
            onClick={handleSubmit}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Submitting..." : isUpdate ? "Update" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
