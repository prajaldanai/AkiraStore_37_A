import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Header.module.css";

import logo from "../../assets/icons/logo.png";
import plusIcon from "../../assets/icons/plus.png";
import searchIcon from "../../assets/icons/search.png";

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const lastScrollY = useRef(0);
  const [visible, setVisible] = useState(true);
  
  // Check if user is logged in by looking for auth token
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem("authToken");
  });

  // Re-check auth state when location changes (e.g., after login redirect)
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
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

  const handleLogout = () => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("userRole");
    
    // Update local state
    setIsLoggedIn(false);
    
    // Redirect to login page
    navigate("/login", { replace: true });
  };

  const handleLogin = () => {
    navigate("/login");
  };

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

        {/* CENTER */}
        <div className={styles.center}>
          <div className={styles.searchBar}>
            <img src={plusIcon} className={styles.iconLeft} alt="add" />
            <input type="text" placeholder="Search product..." />
            <img src={searchIcon} className={styles.iconRight} alt="search" />
          </div>
        </div>

        {/* RIGHT */}
        <div className={styles.right}>
          <div className={styles.navLinks}>
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`${styles.navLink} ${
                  isActive(item.path) ? styles.active : ""
                }`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            className={styles.logoutBtn}
            onClick={isLoggedIn ? handleLogout : handleLogin}
          >
            {isLoggedIn ? "Logout" : "Login"}
          </button>
        </div>
      </div>
    </header>
  );
}
