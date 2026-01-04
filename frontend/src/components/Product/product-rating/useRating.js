// src/components/Product/product-rating/useRating.js

/**
 * TEMPORARILY DISABLED HOOK
 * ------------------------
 * Rating logic is disabled for this sprint.
 * Hook kept only to prevent runtime/import crashes.
 * Returns safe default values and no-op functions.
 */

export default function useRating() {
  return {
    rating: 0,
    ratingCount: 0,

    showPopup: false,
    setShowPopup: () => {},

    hoverRate: 0,
    setHoverRate: () => {},

    showToast: false,
    toastMessage: "",

    submitRating: () => {}, // 🔥 no-op
  };
}
