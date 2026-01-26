/**
 * Sales Report Service
 * Handles all API calls for sales analytics
 */

import { getToken, validateToken, clearAuth } from "../utils/auth";

const API_BASE = "http://localhost:5000/api";

/**
 * Get auth token from localStorage (with validation)
 */
function getAuthToken() {
  const token = getToken();
  const { valid } = validateToken(token);
  return valid ? token : null;
}

/**
 * Get auth headers
 */
function getHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Handle API response with auth error detection
 */
async function handleResponse(response) {
  // Handle auth errors - React Router ProtectedRoute will redirect
  if (response.status === 401 || response.status === 403) {
    clearAuth();
    const currentPath = window.location.pathname;
    if (currentPath !== "/login") {
      sessionStorage.setItem("authMessage", "Please login to continue");
      sessionStorage.setItem("authRedirect", currentPath);
      // React Router will handle redirect via ProtectedRoute
    }
    throw new Error("Authentication required");
  }

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP error ${response.status}`);
  }
  
  return data;
}

/* ============================================================
   SALES REPORT ENDPOINTS
============================================================ */

/**
 * Get full sales report with all analytics
 * @param {Object} options - { fromDate, toDate, categoryId }
 * @returns {Promise<Object>}
 */
export async function getSalesReport(options = {}) {
  const { fromDate, toDate, categoryId } = options;
  
  const params = new URLSearchParams();
  if (fromDate) params.append("fromDate", fromDate);
  if (toDate) params.append("toDate", toDate);
  if (categoryId) params.append("categoryId", categoryId);
  
  const queryString = params.toString();
  const url = `${API_BASE}/admin/sales-report${queryString ? `?${queryString}` : ""}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * Get categories for filter
 * @returns {Promise<Object>}
 */
export async function getCategories() {
  const response = await fetch(`${API_BASE}/admin/sales-report/categories`, {
    method: "GET",
    headers: getHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * Get KPIs only (quick refresh)
 * @param {Object} options - { fromDate, toDate, categoryId }
 * @returns {Promise<Object>}
 */
export async function getKPIs(options = {}) {
  const { fromDate, toDate, categoryId } = options;
  
  const params = new URLSearchParams();
  if (fromDate) params.append("fromDate", fromDate);
  if (toDate) params.append("toDate", toDate);
  if (categoryId) params.append("categoryId", categoryId);
  
  const queryString = params.toString();
  const url = `${API_BASE}/admin/sales-report/kpis${queryString ? `?${queryString}` : ""}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * Get sales trend data
 * @param {Object} options - { fromDate, toDate }
 * @returns {Promise<Object>}
 */
export async function getSalesTrend(options = {}) {
  const { fromDate, toDate } = options;
  
  const params = new URLSearchParams();
  if (fromDate) params.append("fromDate", fromDate);
  if (toDate) params.append("toDate", toDate);
  
  const queryString = params.toString();
  const url = `${API_BASE}/admin/sales-report/trend${queryString ? `?${queryString}` : ""}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });
  
  return handleResponse(response);
}

export default {
  getSalesReport,
  getCategories,
  getKPIs,
  getSalesTrend,
};
