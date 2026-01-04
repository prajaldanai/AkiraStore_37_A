import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./header.css";

import logo from "../../assets/icons/logo.png";
import plusIcon from "../../assets/icons/plus.png";
import searchIcon from "../../assets/icons/search.png";

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const lastScrollY = useRef(0);
  const [visible, setVisible] = useState(true);

  /* ===============================
     HEADER HIDE / SHOW ON SCROLL
  =============================== */
  useEffect(() => {
    const scrollContainer = document.querySelector(".page-content");
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
     NAV ITEMS (UNCHANGED)
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

  /* ===============================
     ✅ FIXED ACTIVE LOGIC
     - Home active for:
       /dashboard
       /shoes
       /electronics
     - Categories active normally
  =============================== */
  const isActive = (path) => {
    const currentPath = location.pathname;

    // ✅ HOME stays active for discovery pages
    if (
      path === "/dashboard" &&
      (
        currentPath === "/dashboard" ||
        currentPath === "/shoes" ||
        currentPath === "/electronics"
      )
    ) {
      return true;
    }

    // ✅ Category pages (women / men / kids)
    if (path.startsWith("/category") && currentPath.startsWith(path)) {
      return true;
    }

    // ✅ Exact match for other routes
    return currentPath === path;
  };

  /* ===============================
     LOGOUT
  =============================== */
  const handleLogout = () => {
    navigate("/", { replace: true });
  };

  return (
    <header className={`app-header ${visible ? "show" : "hide"}`}>
      <div className="app-header-inner">
        {/* LEFT */}
        <div className="header-left">
          <img src={logo} alt="logo" className="header-logo" />
        </div>

        {/* CENTER */}
        <div className="header-center">
          <div className="search-bar">
            <img src={plusIcon} className="search-icon-left" alt="add" />
            <input type="text" placeholder="Search product..." />
            <img src={searchIcon} className="search-icon-right" alt="search" />
          </div>
        </div>

        {/* RIGHT */}
        <div className="header-right">
          <div className="nav-links">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`nav-link ${isActive(item.path) ? "active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button className="logout-text-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
