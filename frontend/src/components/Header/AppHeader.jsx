import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Header.module.css";
import SignatureSearch from "../navbar/SignatureSearch";
import { getToken, validateToken, clearAuth } from "../../utils/auth";

import logo from "../../assets/icons/logo.png";
import { getCartSnapshot } from "../../components/Product/product-actions/useCartAction";

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const lastScrollY = useRef(0);
  const [visible, setVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if user is logged in by validating auth token
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = getToken();
    const { valid } = validateToken(token);
    return valid;
  });
  const [navMessage, setNavMessage] = useState("");
  const navMessageTimer = useRef(null);

  // Re-check auth state when location changes (e.g., after login redirect)
  useEffect(() => {
    const token = getToken();
    const { valid } = validateToken(token);
    setIsLoggedIn(valid);
  }, [location.pathname]);

  /* ===============================
     HEADER HIDE / SHOW ON SCROLL
  =============================== */
  useEffect(() => {
    const scrollContainer = document.querySelector("main");
    if (!scrollContainer) return;

    const onScroll = () => {
      const currentY = scrollContainer.scrollTop;

      if (currentY > lastScrollY.current && currentY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }

      lastScrollY.current = currentY;
    };

    scrollContainer.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", onScroll);
    };
  }, []);

  const triggerNavMessage = (text) => {
    if (!text) {
      setNavMessage("");
      return;
    }
    setNavMessage(text);
    if (navMessageTimer.current) {
      clearTimeout(navMessageTimer.current);
    }
    navMessageTimer.current = setTimeout(() => {
      setNavMessage("");
      navMessageTimer.current = null;
    }, 2800);
  };

  useEffect(() => {
    return () => {
      if (navMessageTimer.current) {
        clearTimeout(navMessageTimer.current);
      }
    };
  }, []);

  /* ===============================
     NAV ITEMS
  =============================== */
  const navItems = [
    { label: "Home", path: "/dashboard" },
    { label: "Women’s", path: "/category/women" },
    { label: "Men’s", path: "/category/men" },
    { label: "Kid’s", path: "/category/kids" },
    { label: "My cart", path: "/cart" },
    { label: "Orders", path: "/orders" },
    { label: "Feedback", path: "/feedback" },
    { label: "About Us", path: "/about" },
  ];

  const isActive = (path) => {
    const currentPath = location.pathname;

    if (
      path === "/dashboard" &&
      (currentPath === "/dashboard" ||
        currentPath === "/shoes" ||
        currentPath === "/electronics")
    ) {
      return true;
    }

    if (path.startsWith("/category") && currentPath.startsWith(path)) {
      return true;
    }

    return currentPath === path;
  };

  const handleNavItemClick = (item) => {
    if (item.path === "/cart") {
      const items = getCartSnapshot();
      const total = items.reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0);
      const message = total
        ? `You have ${total} item${total !== 1 ? "s" : ""} in your cart.`
        : "Your cart is empty.";
      triggerNavMessage(message);
    }
    setMobileMenuOpen(false);
    navigate(item.path);
  };

  const handleLogout = () => {
    // Clear all auth-related data
    clearAuth();
    
    // Update local state
    setIsLoggedIn(false);
    setMobileMenuOpen(false);
    
    // Redirect to login page
    navigate("/login", { replace: true });
  };

  const handleLogin = () => {
    setMobileMenuOpen(false);
    navigate("/login");
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuOpen && !e.target.closest(`.${styles.header}`)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`${styles.header} ${
        visible ? styles.show : styles.hide
      }`}
    >
      <div className={styles.inner}>
        {/* LEFT */}
        <div className={styles.left}>
          <img
            src={logo}
            alt="logo"
            className={styles.logo}
            onClick={() => navigate("/dashboard")}
          />
        </div>

        {/* CENTER - Signature Search */}
        <div className={styles.center}>
          <SignatureSearch />
        </div>

        {/* HAMBURGER MENU BUTTON (Mobile Only) */}
        <button
          className={styles.hamburger}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`${styles.hamburgerLine} ${mobileMenuOpen ? styles.open : ""}`}></span>
          <span className={`${styles.hamburgerLine} ${mobileMenuOpen ? styles.open : ""}`}></span>
          <span className={`${styles.hamburgerLine} ${mobileMenuOpen ? styles.open : ""}`}></span>
        </button>

        {/* RIGHT */}
        <div className={`${styles.right} ${mobileMenuOpen ? styles.mobileMenuOpen : ""}`}>
          {/* Mobile Search - Only visible in mobile menu */}
          <div className={styles.mobileSearch}>
            <SignatureSearch />
          </div>

          <div className={styles.navLinks}>
            {navItems.map((item) => {
              const isCartLink = item.label?.toLowerCase() === "my cart";
              return (
                <button
                  key={item.label}
                  className={`${styles.navLink} ${isActive(item.path) ? styles.active : ""} ${
                    isCartLink ? styles.cartLink : ""
                  }`}
                  onClick={() => handleNavItemClick(item)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div
            className={`${styles.navMessage} ${
              navMessage ? styles.navMessageVisible : ""
            }`}
            role="status"
          >
            {navMessage || "\u00a0"}
          </div>

          <button
            className={styles.logoutBtn}
            onClick={isLoggedIn ? handleLogout : handleLogin}
          >
            {isLoggedIn ? "Logout" : "Login"}
          </button>
        </div>

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div 
            className={styles.overlay} 
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
}
