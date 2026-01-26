import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getToken, validateToken, clearAuth } from "../utils/auth";

export default function useGlobalSSE() {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is logged in by validating auth token
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = getToken();
    const { valid } = validateToken(token);
    return valid;
  });

  // Re-check auth state when location changes (e.g., after login redirect)
  useEffect(() => {
    const token = getToken();
    const { valid } = validateToken(token);
    setIsLoggedIn(valid);
  }, [location.pathname]);

  useEffect(() => {
    const es = new EventSource(
      "http://localhost:5000/api/products/subscribe"
    );

    es.addEventListener("product-update", () => {
      // 🔥 Notify entire app
      window.dispatchEvent(new Event("PRODUCT_UPDATED"));
    });

    es.onerror = () => {
      console.warn("🔴 Global SSE disconnected");
      es.close();
    };

    return () => {
      es.close();
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    setIsLoggedIn(false);
    navigate("/login", { replace: true });
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return { isLoggedIn, handleLogout, handleLogin };
}