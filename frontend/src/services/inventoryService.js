/**
 * Inventory Service
 * Handles all API calls for admin inventory management
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
   INVENTORY ENDPOINTS
============================================================ */

/**
 * Get inventory list with filters
 * @param {Object} options - { category, stockStatus, search, page, limit }
 * @returns {Promise<Object>}
 */
export async function getInventory(options = {}) {
  const { 
    category = "", 
    stockStatus = "", 
    search = "", 
    page = 1, 
    limit = 20 
  } = options;
  
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (stockStatus) params.append("stockStatus", stockStatus);
  if (search) params.append("search", search);
  params.append("page", page);
  params.append("limit", limit);
  
  const response = await fetch(`${API_BASE}/admin/inventory?${params.toString()}`, {
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
  const response = await fetch(`${API_BASE}/admin/inventory/categories`, {
    method: "GET",
    headers: getHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * Adjust stock for a product
 * @param {number} productId - Product ID
 * @param {number} delta - Change in stock (+1 or -1)
 * @returns {Promise<Object>}
 */
export async function adjustStock(productId, delta) {
  const response = await fetch(`${API_BASE}/admin/inventory/${productId}/adjust`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ delta }),
  });
  
  return handleResponse(response);
}

/**
 * Get single product stock info
 * @param {number} productId - Product ID
 * @returns {Promise<Object>}
 */
export async function getProductStock(productId) {
  const response = await fetch(`${API_BASE}/admin/inventory/${productId}`, {
    method: "GET",
    headers: getHeaders(),
  });
  
  return handleResponse(response);
}

export default {
  getInventory,
  getCategories,
  adjustStock,
  getProductStock,
};
