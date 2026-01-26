import axios from "axios";
import { getToken, validateToken, clearAuth } from "../utils/auth";

const API_BASE_URL = "http://localhost:5000/api";

/**
 * Central Axios instance with auth interceptors
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ============================================================
   REQUEST INTERCEPTOR
   Automatically attach Authorization header if token exists
============================================================ */
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    
    if (token) {
      const { valid } = validateToken(token);
      
      if (valid) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Token is invalid/expired - clear it
        clearAuth();
        // Don't add the invalid token to request
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* ============================================================
   RESPONSE INTERCEPTOR
   Handle 401/403 errors - force logout and redirect
============================================================ */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;
    
    // Handle authentication errors
    if (status === 401 || status === 403) {
      // Avoid redirect loop - don't redirect if already on login
      if (currentPath !== "/login" && currentPath !== "/signup") {
        // Clear auth data
        clearAuth();
        
        // Store intended destination for redirect after login
        const returnUrl = currentPath + window.location.search;
        sessionStorage.setItem("authRedirect", returnUrl);
        
        // Redirect to login
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  }
);

/* ============================================================
   API HELPER FUNCTIONS
============================================================ */

/**
 * Check if user is authenticated before making protected requests
 * @returns {boolean}
 */
export function isAuthenticatedForApi() {
  const token = getToken();
  const { valid } = validateToken(token);
  return valid;
}

/**
 * Get the current auth token
 * @returns {string|null}
 */
export function getAuthToken() {
  return getToken();
}

/**
 * Redirect to login with message
 * @param {string} message - Message to show
 */
export function redirectToLogin(message = "Please login to continue") {
  const currentPath = window.location.pathname;
  
  if (currentPath !== "/login") {
    sessionStorage.setItem("authMessage", message);
    sessionStorage.setItem("authRedirect", currentPath + window.location.search);
    window.location.href = "/login";
  }
}

/**
 * Wrapper to ensure auth before API call
 * Shows login message and redirects if not authenticated
 * @param {Function} apiCall - The API call function
 * @returns {Promise}
 */
export async function withAuth(apiCall) {
  if (!isAuthenticatedForApi()) {
    redirectToLogin("Please login to continue");
    throw new Error("Authentication required");
  }
  
  return apiCall();
}

export default api;
