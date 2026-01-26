/**
 * Dashboard Service
 * API client for admin dashboard endpoints
 */

import { getToken, validateToken, clearAuth } from "../utils/auth";

const API_BASE = "http://localhost:5000/api/admin/dashboard";

// Get auth headers with token validation
function getAuthHeaders() {
  const token = getToken();
  const { valid } = validateToken(token);
  
  if (!valid) {
    return {
      "Content-Type": "application/json",
    };
  }
  
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Handle auth errors
function handleAuthError(response) {
  if (response.status === 401 || response.status === 403) {
    clearAuth();
    const currentPath = window.location.pathname;
    if (currentPath !== "/login") {
      sessionStorage.setItem("authMessage", "Please login to continue");
      sessionStorage.setItem("authRedirect", currentPath);
      window.location.href = "/login";
    }
    return true;
  }
  return false;
}

/**
 * Get full dashboard data
 * @param {number} days - Number of days for sales overview (7 or 30)
 */
export async function getDashboard(days = 7) {
  const response = await fetch(`${API_BASE}?days=${days}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  if (handleAuthError(response)) {
    throw new Error("Authentication required");
  }
  
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }
  
  return response.json();
}

/**
 * Get KPIs only
 */
export async function getKPIs() {
  const response = await fetch(`${API_BASE}/kpis`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch KPIs");
  }
  
  return response.json();
}

/**
 * Get sales overview
 * @param {number} days - Number of days
 */
export async function getSalesOverview(days = 7) {
  const response = await fetch(`${API_BASE}/sales?days=${days}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch sales overview");
  }
  
  return response.json();
}

/**
 * Get recent orders
 * @param {number} limit - Number of orders
 */
export async function getRecentOrders(limit = 10) {
  const response = await fetch(`${API_BASE}/recent-orders?limit=${limit}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch recent orders");
  }
  
  return response.json();
}

/**
 * Get admin notifications
 * Returns real-time notifications (new orders, low stock, cancelled)
 */
export async function getNotifications() {
  const response = await fetch(`${API_BASE}/notifications`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  
  return response.json();
}

/**
 * Global admin search
 * Search across products, orders, and users
 * @param {string} query - Search query
 */
export async function globalSearch(query) {
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error("Search failed");
  }
  
  return response.json();
}
