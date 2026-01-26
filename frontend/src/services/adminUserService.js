/**
 * Admin User Service
 * API client for admin user management endpoints
 */

import { getToken, validateToken, clearAuth } from "../utils/auth";

const API_BASE = "http://localhost:5000/api/admin/users";

// Get auth headers with validation
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
async function handleResponse(response) {
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * Get all users with stats
 * @param {object} options - { search, status, page, limit }
 */
export async function getUsers({ search = "", status = "", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status && status !== "ALL") params.append("status", status);
  params.append("page", page);
  params.append("limit", limit);

  const response = await fetch(`${API_BASE}?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

/**
 * Get single user by ID
 * @param {number} userId
 */
export async function getUserById(userId) {
  const response = await fetch(`${API_BASE}/${userId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

/**
 * Block a user
 * @param {number} userId
 * @param {string} reason - Optional reason
 */
export async function blockUser(userId, reason = null) {
  const response = await fetch(`${API_BASE}/${userId}/block`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });

  return handleResponse(response);
}

/**
 * Unblock a user
 * @param {number} userId
 */
export async function unblockUser(userId) {
  const response = await fetch(`${API_BASE}/${userId}/unblock`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

/**
 * Suspend a user for N days
 * @param {number} userId
 * @param {number} days - 1-365
 * @param {string} reason - Optional reason
 */
export async function suspendUser(userId, days, reason = null) {
  const response = await fetch(`${API_BASE}/${userId}/suspend`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ days, reason }),
  });

  return handleResponse(response);
}

/**
 * Unsuspend a user (remove suspension)
 * @param {number} userId
 */
export async function unsuspendUser(userId) {
  const response = await fetch(`${API_BASE}/${userId}/unsuspend`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
}

export default {
  getUsers,
  getUserById,
  blockUser,
  unblockUser,
  suspendUser,
  unsuspendUser,
};
