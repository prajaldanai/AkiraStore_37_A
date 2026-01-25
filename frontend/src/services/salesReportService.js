/**
 * Sales Report Service
 * Handles all API calls for sales analytics
 */

const API_BASE = "http://localhost:5000/api";

/**
 * Get auth token from localStorage
 */
function getAuthToken() {
  return localStorage.getItem("authToken");
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
 * Handle API response
 */
async function handleResponse(response) {
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
