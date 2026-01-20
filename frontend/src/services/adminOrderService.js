/**
 * Admin Order Service
 * Handles all API calls for admin order management
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
   ADMIN ORDER ENDPOINTS
============================================================ */

/**
 * Get admin orders (active or history)
 * @param {Object} options - { scope, search, status, page, limit }
 * @returns {Promise<Object>}
 */
export async function getAdminOrders(options = {}) {
  const { 
    scope = "active", 
    search = "", 
    status = "", 
    page = 1, 
    limit = 20 
  } = options;
  
  const params = new URLSearchParams();
  params.append("scope", scope);
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  params.append("page", page);
  params.append("limit", limit);
  
  const response = await fetch(`${API_BASE}/admin/orders?${params.toString()}`, {
    method: "GET",
    headers: getHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * Get single admin order by ID
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export async function getAdminOrderById(orderId) {
  const response = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
    method: "GET",
    headers: getHeaders(),
  });
  
  return handleResponse(response);
}

/**
 * Update order status
 * @param {string} orderId
 * @param {string} status - PROCESSING | SHIPPED | DELIVERED | CANCELLED
 * @returns {Promise<Object>}
 */
export async function updateOrderStatus(orderId, status) {
  const response = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  
  return handleResponse(response);
}

/**
 * Get order statistics
 * @returns {Promise<Object>}
 */
export async function getOrderStats() {
  const response = await fetch(`${API_BASE}/admin/orders/stats`, {
    method: "GET",
    headers: getHeaders(),
  });
  
  return handleResponse(response);
}
