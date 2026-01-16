import { useEffect, useMemo, useState, useCallback, useRef } from "react";

const API_BASE = "http://localhost:5000/api";

function submitRatingToAPI(productId, rating, token, onComplete) {
  fetch(`${API_BASE}/rating/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ product_id: productId, rating }),
  })
    .then(async (response) => {
      const data = await response.json();
      onComplete(null, { status: response.status, data });
    })
    .catch((error) => {
      onComplete(error, null);
    });
}

export default function useRating({ productId, initialAvg = 0, initialCount = 0 }) {
  const safeId = useMemo(
    () => (productId == null ? "" : String(productId)),
    [productId]
  );

  const [showPopup, setShowPopup] = useState(false);
  const [fetchingRating, setFetchingRating] = useState(true);

  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [userRating, setUserRating] = useState(0);

  const [tempValue, setTempValue] = useState(0);
  const [hoverValue, setHoverValue] = useState(0);

  const [message, setMessage] = useState({ type: "", text: "" });

  const hasFetched = useRef(false);
  const isMounted = useRef(true);
  const hasLoggedError = useRef(false);

  const hasRated = userRating > 0;

  const clearMessage = useCallback(() => {
    setMessage({ type: "", text: "" });
  }, []);

  const pushMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 3000);
  }, []);

  const isLoggedIn = useCallback(() => {
    return !!localStorage.getItem("authToken");
  }, []);

  const fetchRatingData = useCallback(async () => {
    if (!safeId) {
      setFetchingRating(false);
      return;
    }

    try {
      setFetchingRating(true);

      const token = localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/rating/product/${safeId}`, { headers });
      const data = await res.json();

      if (!isMounted.current) return;

      if (data.success) {
        setAvg(Number(data.avg_rating) || 0);
        setCount(Number(data.rating_count) || 0);
        setUserRating(data.user_rating || 0);
        hasLoggedError.current = false;
      }
    } catch (err) {
      if (!hasLoggedError.current) {
        hasLoggedError.current = true;
      }
    } finally {
      if (isMounted.current) {
        setFetchingRating(false);
      }
    }
  }, [safeId]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    hasFetched.current = false;
    hasLoggedError.current = false;
  }, [safeId]);

  useEffect(() => {
    if (safeId && !hasFetched.current) {
      hasFetched.current = true;
      fetchRatingData();
    }
  }, [safeId, fetchRatingData]);

  const openRate = useCallback(() => {
    if (!safeId) {
      pushMessage("info", "Product not available for rating.");
      return;
    }

    if (!isLoggedIn()) {
      pushMessage("info", "Please log in to rate this product.");
      return;
    }

    clearMessage();
    setTempValue(userRating || 0);
    setHoverValue(0);
    setShowPopup(true);
  }, [safeId, isLoggedIn, userRating, pushMessage, clearMessage]);

  const closePopup = useCallback(() => {
    setShowPopup(false);
    setTempValue(0);
    setHoverValue(0);
  }, []);

    const submitRating = useCallback(() => {
  return new Promise((resolve, reject) => {
    const finalValue = hoverValue || tempValue;

    if (!safeId) {
      pushMessage("error", "Product not found.");
      setShowPopup(false);
      reject();
      return;
    }

    if (!finalValue || finalValue < 1 || finalValue > 5) {
      pushMessage("info", "Please select a rating from 1 to 5 stars.");
      reject();
      return;
    }

    if (!isLoggedIn()) {
      pushMessage("error", "Please log in to rate.");
      setShowPopup(false);
      reject();
      return;
    }

    const token = localStorage.getItem("authToken");

    submitRatingToAPI(safeId, finalValue, token, (error, result) => {
      if (error) {
        pushMessage("error", "Network error. Please try again.");
        reject(error);
        return;
      }

      const { status, data } = result;

      if (status === 200 && data.success) {
        setAvg(Number(data.avg_rating) || 0);
        setCount(Number(data.rating_count) || 0);
        setUserRating(data.user_rating);
        setShowPopup(false);
        pushMessage("success", data.is_update ? "Rating updated!" : "Thanks for rating!");
        resolve();
      } else {
        pushMessage("error", data.message || "Failed to submit rating.");
        reject();
      }
    });
  });
}, [hoverValue, tempValue, safeId, isLoggedIn, pushMessage]);


  return {
    avg,
    count,
    hasRated,
    userRating,
    fetchingRating,
    showPopup,
    tempValue,
    hoverValue,
    setTempValue,
    setHoverValue,
    openRate,
    closePopup,
    submitRating,
    refetch: fetchRatingData,
    message,
    clearMessage,
  };
}
