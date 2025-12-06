import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({ children }) {
  const token = localStorage.getItem("authToken");
  const role = localStorage.getItem("role");

  // ❌ No token → not logged in
  if (!token) return <Navigate to="/login" />;

  // ❌ Logged in but NOT admin
  if (role !== "admin") return <Navigate to="/dashboard" />;

  // ✔ Admin allowed
  return children;
}
