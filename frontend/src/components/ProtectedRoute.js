import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("authToken");

  // If no token → redirect to login page
  if (!token) {
    return <Navigate to="/login" />;
  }

  // If token exists → allow the user to visit the page
  return children;
}
