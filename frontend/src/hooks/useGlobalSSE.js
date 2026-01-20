import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function useGlobalSSE() {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is logged in by looking for auth token
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem("authToken");
  });

  // Re-check auth state when location changes (e.g., after login redirect)
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
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
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    navigate("/login", { replace: true });
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return { isLoggedIn, handleLogout, handleLogin };
}