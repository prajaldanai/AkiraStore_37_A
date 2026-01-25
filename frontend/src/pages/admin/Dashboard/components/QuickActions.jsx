/**
 * Quick Actions Component
 * Common admin tasks shortcuts
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./QuickActions.module.css";

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

const QuickActions = () => {
  const navigate = useNavigate();
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const actions = [
    {
      id: "add-product",
      label: "Add Product",
      description: "Create new product listing",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 6V14M6 10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      onClick: () => navigate("/admin/inventory"),
      color: "#6366f1",
    },
    {
      id: "view-orders",
      label: "Manage Orders",
      description: "View and process orders",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M16 6L10 2L4 6V14L10 18L16 14V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      ),
      onClick: () => navigate("/admin/orders"),
      color: "#10b981",
    },
    {
      id: "sales-report",
      label: "Sales Report",
      description: "View detailed analytics",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 17V7L7 10L10 5L13 9L17 3V17H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      ),
      onClick: () => navigate("/admin/sales-report"),
      color: "#f59e0b",
    },
    {
      id: "categories",
      label: "Categories",
      description: "Manage product categories",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5H17M3 10H17M3 15H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      onClick: () => setShowCategoryModal(true),
      color: "#8b5cf6",
    },
  ];

  return (
    <>
      <div className={styles.card}>
        <h3 className={styles.title}>Quick Actions</h3>
        <div className={styles.grid}>
          {actions.map((action) => (
            <button
              key={action.id}
              className={styles.actionBtn}
              onClick={action.onClick}
            >
              <span className={styles.iconWrapper} style={{ color: action.color }}>
                {action.icon}
              </span>
              <span className={styles.actionLabel}>{action.label}</span>
              <span className={styles.actionDesc}>{action.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCategoryModal(false)}>
          <div className={styles.categoryPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.panelHeader}>
              <h3>Select Category</h3>
              <button className={styles.closeBtn} onClick={() => setShowCategoryModal(false)}>×</button>
            </div>
            <div className={styles.panelContent}>
              <ul className={styles.categoryList}>
                {CATEGORIES.map((cat) => (
                  <li
                    key={cat.slug}
                    className={styles.categoryItem}
                    onClick={() => {
                      navigate(`/admin/category/${cat.slug}`);
                      setShowCategoryModal(false);
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

export default QuickActions;
