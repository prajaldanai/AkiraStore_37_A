import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PublicRoute - For pages like login/register
 * Redirects authenticated users to dashboard
 */
export default function PublicRoute({ children }) {
  const { isAuthenticated, isAuthReady, isAdmin } = useAuth();
  const location = useLocation();

  // Wait for auth to initialize
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

  // If authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    // Check if there's a stored redirect destination
    const intendedPath = location.state?.from;
    
    if (intendedPath && intendedPath !== "/login" && intendedPath !== "/signup") {
      return <Navigate to={intendedPath} replace />;
    }
    
    // Default redirect based on role
    if (isAdmin) {
      return <Navigate to="/admin-dashboard" replace />;
    }
    
    return <Navigate to="/dashboard" replace />;
  }

  // Not authenticated - show the public page
  return children;
}
