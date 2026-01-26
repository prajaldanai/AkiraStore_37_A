import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getToken, validateToken, clearAuth, getRole } from "../utils/auth";

/**
 * AdminProtectedRoute - For admin-only pages
 * Validates token + checks admin role
 */
export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, isAuthReady, isAdmin } = useAuth();
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

  // ❌ Not authenticated → redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname + location.search }} 
        replace 
      />
    );
  }

  // ❌ Authenticated but NOT admin → redirect to user dashboard
  const role = getRole();
  if (!isAdmin && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // ✔ Admin → render the protected content
  return children;
}
