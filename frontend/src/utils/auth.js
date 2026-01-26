/**
 * Authentication Utilities
 * Handles token storage, retrieval, and validation
 */

const TOKEN_KEY = "authToken";
const ROLE_KEY = "role";
const USER_KEY = "user";

/* ============================================================
   TOKEN STORAGE OPERATIONS
============================================================ */

/**
 * Get token from localStorage
 * @returns {string|null}
 */
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Set token in localStorage
 * @param {string} token
 */
export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to save token:", error);
  }
}

/**
 * Remove token and auth data from localStorage
 */
export function removeToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error("Failed to remove token:", error);
  }
}

/**
 * Get user role from localStorage
 * @returns {string|null}
 */
export function getRole() {
  try {
    return localStorage.getItem(ROLE_KEY);
  } catch {
    return null;
  }
}

/**
 * Set user role in localStorage
 * @param {string} role
 */
export function setRole(role) {
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch (error) {
    console.error("Failed to save role:", error);
  }
}

/**
 * Get stored user data
 * @returns {Object|null}
 */
export function getStoredUser() {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

/**
 * Set user data in localStorage
 * @param {Object} user
 */
export function setStoredUser(user) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Failed to save user:", error);
  }
}

/* ============================================================
   TOKEN VALIDATION
============================================================ */

/**
 * Decode JWT token payload (without verification)
 * @param {string} token
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export function decodeToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Validate each part is valid base64url (alphanumeric, -, _)
    const base64urlRegex = /^[A-Za-z0-9_-]+$/;
    for (const part of parts) {
      if (!part || !base64urlRegex.test(part)) {
        return null;
      }
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Handle base64url encoding (replace - with +, _ with /)
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    
    // Add padding if needed
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    
    // Decode and parse
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);
    
    // Validate payload has required JWT claims
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    // Must have at least exp claim or userId/role for our tokens
    if (!parsed.exp && !parsed.userId && !parsed.role) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 * @param {string} token
 * @returns {boolean} - true if expired or invalid
 */
export function isTokenExpired(token) {
  const payload = decodeToken(token);
  
  if (!payload) {
    return true; // Invalid token = treat as expired
  }

  // Check exp claim if present
  if (payload.exp) {
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    // Add 5 second buffer for clock skew
    if (now >= expirationTime - 5000) {
      return true;
    }
  }

  return false;
}

/**
 * Validate token structure and expiration
 * @param {string} token
 * @returns {Object} - { valid: boolean, payload: Object|null, reason: string|null }
 */
export function validateToken(token) {
  // Check if token exists
  if (!token) {
    return { valid: false, payload: null, reason: "missing" };
  }

  // Check token format (must be string with 3 parts)
  if (typeof token !== "string") {
    return { valid: false, payload: null, reason: "invalid_format" };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, payload: null, reason: "invalid_structure" };
  }

  // Try to decode payload
  const payload = decodeToken(token);
  if (!payload) {
    return { valid: false, payload: null, reason: "decode_failed" };
  }

  // Check expiration
  if (isTokenExpired(token)) {
    return { valid: false, payload, reason: "expired" };
  }

  // Token is valid (client-side check)
  return { valid: true, payload, reason: null };
}

/**
 * Check if user is authenticated with valid token
 * @returns {boolean}
 */
export function isAuthenticated() {
  const token = getToken();
  const { valid } = validateToken(token);
  return valid;
}

/**
 * Check if user is admin
 * @returns {boolean}
 */
export function isAdmin() {
  if (!isAuthenticated()) {
    return false;
  }
  
  const role = getRole();
  return role === "admin";
}

/**
 * Clear all auth data (logout)
 */
export function clearAuth() {
  removeToken();
}

/**
 * Get user info from token
 * @returns {Object|null}
 */
export function getUserFromToken() {
  const token = getToken();
  const { valid, payload } = validateToken(token);
  
  if (!valid || !payload) {
    return null;
  }

  return {
    id: payload.userId || payload.id,
    username: payload.username,
    role: payload.role,
  };
}
