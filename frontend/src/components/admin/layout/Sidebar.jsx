/**
 * Admin Sidebar Component
 * Minimal flat sidebar with navigation items
 */

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { clearAuth } from "../../../utils/auth";
import styles from "./Sidebar.module.css";

// Category list - matches database
const CATEGORIES = [
  { name: "Men Clothes", slug: "men" },
  { name: "Women Clothes", slug: "women" },
  { name: "Kids Clothes", slug: "kids" },
  { name: "Glasses", slug: "glasses" },
  { name: "Shoes", slug: "shoes" },
  { name: "Grocery", slug: "grocery" },
  { name: "Electronics", slug: "electronics" },
];

const MENU_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/admin-dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "categories",
    label: "Categories",
    path: "/admin/categories",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 5H17M3 10H17M3 15H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "orders",
    label: "Orders",
    path: "/admin/orders",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M16 6L10 2L4 6V14L10 18L16 14V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M10 10V18M10 10L4 6M10 10L16 6" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "inventory",
    label: "Inventory",
    path: "/admin/inventory",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 5V3C7 2.44772 7.44772 2 8 2H12C12.5523 2 13 2.44772 13 3V5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 9H17" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: "sales-report",
    label: "Sales Report",
    path: "/admin/sales-report",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 17V7L7 10L10 5L13 9L17 3V17H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "users",
    label: "Users",
    path: "/admin/users",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 18C4 14.6863 6.68629 12 10 12C13.3137 12 16 14.6863 16 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "order-history",
    label: "Order History",
    path: "/admin/order-history",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 6V10L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);

  const isActive = (path) => {
    if (path === "/admin-dashboard") {
      return location.pathname === "/admin-dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (item) => {
    if (item.id === "categories") {
      setShowCategoryPanel(true);
    } else {
      navigate(item.path);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>A</div>
          {!collapsed && <span className={styles.logoText}>AkiraStore</span>}
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${isActive(item.path) ? styles.active : ""}`}
              onClick={() => handleNavigation(item)}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
        >
          <span className={styles.navIcon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 17H4C3.44772 17 3 16.5523 3 16V4C3 3.44772 3.44772 3 4 3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M13 14L17 10L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          {!collapsed && <span className={styles.navLabel}>Logout</span>}
        </button>

        {/* Collapse Toggle */}
        <button className={styles.collapseBtn} onClick={onToggle}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={collapsed ? styles.rotated : ""}>
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </aside>

      {/* Category Panel Modal */}
      {showCategoryPanel && (
        <div className={styles.modalOverlay} onClick={() => setShowCategoryPanel(false)}>
          <div className={styles.categoryPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.panelHeader}>
              <h3>Select Category</h3>
              <button className={styles.closeBtn} onClick={() => setShowCategoryPanel(false)}>×</button>
            </div>
            <div className={styles.panelContent}>
              <ul className={styles.categoryList}>
                {CATEGORIES.map((cat) => (
                  <li
                    key={cat.slug}
                    className={styles.categoryItem}
                    onClick={() => {
                      navigate(`/admin/category/${cat.slug}`);
                      setShowCategoryPanel(false);
                    }}
                  >
                    <span className={styles.categoryIcon}>📁</span>
                    <span className={styles.categoryName}>{cat.name}</span>
                    <span className={styles.categoryArrow}>→</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
