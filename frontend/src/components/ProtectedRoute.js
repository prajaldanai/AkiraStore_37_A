import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getToken, validateToken, clearAuth } from "../utils/auth";

/**
 * ProtectedRoute - For pages that require authentication
 * Validates token and redirects to login if invalid/missing/expired
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isAuthReady, logout } = useAuth();
  const location = useLocation();

  // Direct token validation on every render
  useEffect(() => {
    const currentToken = getToken();
    const { valid } = validateToken(currentToken);
    
    if (!valid && isAuthReady) {
      clearAuth();
      sessionStorage.setItem("authMessage", "Please log in to continue.");
      // Navigate component will handle the redirect on next render
    }
  }, [location.pathname, isAuthReady]);

  // Wait for auth to initialize (prevent flicker)
  if (!isAuthReady) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh" 
      }}>
        <span>Loading...</span>
      </div>
    );
  }

  // Direct token check (catches edited tokens immediately)
  const currentToken = getToken();
  const { valid } = validateToken(currentToken);
  
  if (!valid) {
    clearAuth();
    sessionStorage.setItem("authMessage", "Please log in to continue.");
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname + location.search }} 
        replace 
      />
    );
  }

  // If not authenticated → redirect to login with return path
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname + location.search }} 
        replace 
      />
    );
  }

  // Authenticated → render the protected content
  return children;
}
