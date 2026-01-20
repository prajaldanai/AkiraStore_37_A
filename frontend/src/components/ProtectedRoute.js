import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("authToken");
  const location = useLocation();

  // If no token → redirect to login page with intended destination
  if (!token) {
    // Pass the current location so login can redirect back after success
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  // If token exists → allow the user to visit the page
  return children;
}
