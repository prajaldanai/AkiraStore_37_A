// src/components/Product/product-rating/useRating.js
import { useEffect, useRef, useState } from "react";

const normalizeAvg = (value) => Number(value) || 0;
const normalizeCount = (value) => Math.max(0, Number(value) || 0);

export default function useRating({
  productId,
  initialAvg = 0,
  initialCount = 0,
}) {
  const [avg, setAvg] = useState(() => normalizeAvg(initialAvg));
  const [count, setCount] = useState(() => normalizeCount(initialCount));
  const [userRating, setUserRating] = useState(null);
  const [hasRated, setHasRated] = useState(false);
  const [tempValue, setTempValue] = useState(0);
  const [hoverValue, setHoverValue] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState(null);
  const lastProductId = useRef(productId);

  useEffect(() => {
    setAvg(normalizeAvg(initialAvg));
    setCount(normalizeCount(initialCount));
  }, [initialAvg, initialCount]);

  useEffect(() => {
    if (lastProductId.current !== productId) {
      lastProductId.current = productId;
      setHasRated(false);
      setUserRating(null);
      setTempValue(0);
      setHoverValue(0);
      setShowPopup(false);
      setMessage(null);
    }
  }, [productId]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 2200);
    return () => clearTimeout(timer);
  }, [message]);

  const clearMessage = () => setMessage(null);

  const openRate = () => {
    setTempValue(userRating ?? 0);
    setHoverValue(0);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setHoverValue(0);
    setTempValue(userRating ?? 0);
  };

  const submitRating = (value) => {
    const numeric = Number(value ?? tempValue);
    if (!numeric || numeric < 1 || numeric > 5) {
      setMessage({
        type: "info",
        text: "Please select between 1 and 5 stars before submitting.",
      });
      return;
    }

    const previousTotal = avg * count;
    let updatedAvg = avg;
    let updatedCount = count;

    if (hasRated && typeof userRating === "number") {
      const adjustedTotal = previousTotal - userRating + numeric;
      updatedAvg =
        updatedCount > 0 ? adjustedTotal / updatedCount : normalizeAvg(numeric);
      setMessage({ type: "success", text: "Rating updated!" });
    } else {
      updatedCount += 1;
      updatedAvg = (previousTotal + numeric) / updatedCount;
      setCount(updatedCount);
      setHasRated(true);
      setMessage({ type: "success", text: "Thanks for rating!" });
    }

    setAvg(updatedAvg);
    setUserRating(numeric);
    setTempValue(numeric);
    setHoverValue(0);
    setShowPopup(false);
  };

  return {
    avg,
    count,
    userRating,
    hasRated,
    tempValue,
    hoverValue,
    setHoverValue,
    setTempValue,
    showPopup,
    openRate,
    closePopup,
    submitRating,
    loading: false,
    message,
    clearMessage,
  };
}
