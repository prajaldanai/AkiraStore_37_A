import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getToken,
  setToken as saveToken,
  removeToken,
  getRole,
  setRole as saveRole,
  validateToken,
  getUserFromToken,
  clearAuth,
} from "../utils/auth";

/* ============================================================
   AUTH CONTEXT
============================================================ */

const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Wraps app and provides authentication state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Initialize auth state from localStorage
   */
  useEffect(() => {
    const initAuth = () => {
      const storedToken = getToken();
      const { valid } = validateToken(storedToken);

      if (valid) {
        const userInfo = getUserFromToken();
        setTokenState(storedToken);
        setUser(userInfo);
        setIsAuthenticated(true);
      } else {
        // Invalid or expired token - clear it
        clearAuth();
        setTokenState(null);
        setUser(null);
        setIsAuthenticated(false);
        
        // If there was a token but it's invalid, set a message
        // (Don't redirect if no token was present - could be first visit)
        if (storedToken) {
          sessionStorage.setItem("authMessage", "Session invalid. Please log in again.");
          // React Router's ProtectedRoute will handle the redirect
        }
      }

      setIsAuthReady(true);
    };

    initAuth();
  }, []);

  /**
   * Periodic token validation (check every 2 seconds)
   */
  useEffect(() => {
    if (!isAuthReady) return;

    const checkToken = () => {
      const currentToken = getToken();
      const { valid } = validateToken(currentToken);

      if (!valid && isAuthenticated) {
        // Token became invalid - logout
        logout();
        // Set message, React Router will handle redirect via ProtectedRoute
        sessionStorage.setItem("authMessage", "Session invalid. Please log in again.");
      }
    };

    // Check every 2 seconds
    const interval = setInterval(checkToken, 2000);
    return () => clearInterval(interval);
  }, [isAuthReady, isAuthenticated]);

  /**
   * Check token on ANY user interaction (click, keypress, mousemove)
   * This catches token edits immediately when user tries to do anything
   */
  useEffect(() => {
    if (!isAuthReady) return;

    const checkTokenOnInteraction = () => {
      const currentToken = getToken();
      const { valid } = validateToken(currentToken);

      if (!valid && isAuthenticated) {
        logout();
        sessionStorage.setItem("authMessage", "Session invalid. Please log in again.");
        // React Router will handle redirect via ProtectedRoute
      }
    };

    // Check on any user interaction
    window.addEventListener("click", checkTokenOnInteraction);
    window.addEventListener("keydown", checkTokenOnInteraction);
    window.addEventListener("focus", checkTokenOnInteraction);
    
    return () => {
      window.removeEventListener("click", checkTokenOnInteraction);
      window.removeEventListener("keydown", checkTokenOnInteraction);
      window.removeEventListener("focus", checkTokenOnInteraction);
    };
  }, [isAuthReady, isAuthenticated]);

  /**
   * Listen for localStorage changes (detects manual token edits)
   */
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Check if authToken was changed
      if (e.key === "authToken" || e.key === null) {
        const currentToken = getToken();
        const { valid } = validateToken(currentToken);

        if (!valid) {
          logout();
          sessionStorage.setItem("authMessage", "Session invalid. Please log in again.");
          // React Router will handle redirect via ProtectedRoute
        }
      }
    };

    // Listen for storage events (works across tabs)
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /**
   * Override localStorage.setItem to detect same-tab changes
   */
  useEffect(() => {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);

    localStorage.setItem = (key, value) => {
      originalSetItem(key, value);
      if (key === "authToken") {
        // Dispatch custom event for same-tab detection
        window.dispatchEvent(new CustomEvent("localStorageChange", { detail: { key, value } }));
      }
    };

    localStorage.removeItem = (key) => {
      originalRemoveItem(key);
      if (key === "authToken") {
        window.dispatchEvent(new CustomEvent("localStorageChange", { detail: { key, value: null } }));
      }
    };

    const handleLocalStorageChange = (e) => {
      if (e.detail.key === "authToken") {
        const currentToken = getToken();
        const { valid } = validateToken(currentToken);

        if (!valid && isAuthenticated) {
          logout();
          sessionStorage.setItem("authMessage", "Session invalid. Please log in again.");
          // React Router will handle redirect via ProtectedRoute
        }
      }
    };

    window.addEventListener("localStorageChange", handleLocalStorageChange);

    return () => {
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
      window.removeEventListener("localStorageChange", handleLocalStorageChange);
    };
  }, [isAuthenticated]);

  /**
   * Check token when page becomes visible (handles same-tab edits)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAuthReady) {
        const currentToken = getToken();
        const { valid } = validateToken(currentToken);

        if (!valid && isAuthenticated) {
          logout();
          sessionStorage.setItem("authMessage", "Session invalid. Please log in again.");
          // React Router will handle redirect via ProtectedRoute
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthReady, isAuthenticated]);

  /**
   * Login - save token and user data
   */
  const login = useCallback((newToken, userData = {}) => {
    if (!newToken) return false;

    const { valid, payload } = validateToken(newToken);
    if (!valid) {
      console.error("Login failed: Invalid token");
      return false;
    }

    // Save to localStorage
    saveToken(newToken);
    if (userData.role || payload.role) {
      saveRole(userData.role || payload.role);
    }

    // Update state
    const userInfo = {
      id: userData.id || payload.userId || payload.id,
      username: userData.username || payload.username,
      role: userData.role || payload.role,
      ...userData,
    };

    setTokenState(newToken);
    setUser(userInfo);
    setIsAuthenticated(true);

    return true;
  }, []);

  /**
   * Logout - clear all auth data
   */
  const logout = useCallback(() => {
    clearAuth();
    setTokenState(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role) => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  /**
   * Get current token (validates before returning)
   */
  const getValidToken = useCallback(() => {
    const currentToken = getToken();
    const { valid } = validateToken(currentToken);
    
    if (!valid) {
      logout();
      return null;
    }
    
    return currentToken;
  }, [logout]);

  const value = {
    user,
    token: token,
    isAuthenticated,
    isAuthReady,
    isAdmin: user?.role === "admin",
    login,
    logout,
    hasRole,
    getValidToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo = "/login") {
  const { isAuthenticated, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      navigate(redirectTo, { 
        replace: true, 
        state: { from: location.pathname + location.search } 
      });
    }
  }, [isAuthenticated, isAuthReady, navigate, redirectTo, location]);

  return { isAuthenticated, isAuthReady };
}

export default AuthContext;
