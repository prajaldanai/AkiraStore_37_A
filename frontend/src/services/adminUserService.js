/**
 * Admin User Service
 * API client for admin user management endpoints
 */

const API_BASE = "http://localhost:5000/api/admin/users";

// Get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch users");
  }

  return response.json();
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch user");
  }

  return response.json();
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to block user");
  }

  return response.json();
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to unblock user");
  }

  return response.json();
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to suspend user");
  }

  return response.json();
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to unsuspend user");
  }

  return response.json();
}

export default {
  getUsers,
  getUserById,
  blockUser,
  unblockUser,
  suspendUser,
  unsuspendUser,
};
