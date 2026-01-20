import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("role");
  const location = useLocation();

  // ❌ No token → not logged in
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  // ❌ Logged in but NOT admin
  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  // ✔ Admin allowed
  return children;
}
