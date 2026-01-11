// src/components/Product/product-rating/useRating.js
import { useEffect, useState, useRef } from "react";

export default function useRating(item) {
  const [rating, setRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  const [showPopup, setShowPopup] = useState(false);
  const [hoverRate, setHoverRate] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 🔐 Track if THIS user already rated THIS product
  const hasRatedRef = useRef(false);
  const lastItemId = useRef(null);

  // 🔁 Reset ONLY when product changes
  useEffect(() => {
    if (item?.id !== lastItemId.current) {
      lastItemId.current = item?.id;

      setRating(Number(item?.avg_rating) || 0);
      setRatingCount(Number(item?.rating_count) || 0);

      hasRatedRef.current = false; // reset per product
      setHoverRate(0);
      setShowPopup(false);
      setShowToast(false);
      setToastMessage("");
    }
  }, [item?.id, item?.avg_rating, item?.rating_count]);

  const submitRating = (value) => {
    const newRating = Number(value);
    if (!newRating || newRating < 1 || newRating > 5) return;

    // ❌ USER ALREADY RATED THIS PRODUCT
    if (hasRatedRef.current) {
      setShowPopup(false);
      setToastMessage("You have already rated this product ⭐");
      setShowToast(true);

      setTimeout(() => setShowToast(false), 1800);
      return;
    }

    // ✅ FIRST TIME RATING
    setRating(newRating);
    setRatingCount((prev) => prev + 1);
    hasRatedRef.current = true;

    setShowPopup(false);
    setToastMessage("⭐ Thanks for rating!");
    setShowToast(true);

    setTimeout(() => setShowToast(false), 1800);
  };

  return {
    rating,
    ratingCount,

    showPopup,
    setShowPopup,

    hoverRate,
    setHoverRate,

    showToast,
    toastMessage,
    submitRating,
  };
}
