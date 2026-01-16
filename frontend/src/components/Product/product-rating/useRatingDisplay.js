// src/components/Product/product-rating/useRatingDisplay.js
/**
 * READ-ONLY rating display hook for Product Cards (Home, Category pages)
 * 
 * PURPOSE:
 * - Display average rating and count from props ONLY
 * - NO API calls (data comes from parent product fetch)
 * - NO user interaction (rate/update)
 * - NO authentication checks
 * 
 * This is a lightweight hook that simply formats the rating data
 * passed from the product listing API response.
 * 
 * For FULL rating interaction (rate/update), use useRating in ProductDetails page.
 */
export default function useRatingDisplay({ 
  avgRating = 0, 
  ratingCount = 0 
}) {
  // Simply normalize and return the values
  const avg = Number(avgRating) || 0;
  const count = Number(ratingCount) || 0;

  return {
    avg,
    count,
    // Helper for display
    hasRatings: count > 0,
  };
}
