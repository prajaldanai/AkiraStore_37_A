/**
 * CategoryFilter Component
 * Filter panel for inventory - categories, stock status, search
 */

import React from "react";
import styles from "./CategoryFilter.module.css";

const STOCK_STATUSES = [
  { value: "", label: "All Stock" },
  { value: "in_stock", label: "In Stock" },
  { value: "low_stock", label: "Low Stock (≤5)" },
  { value: "out_of_stock", label: "Out of Stock" },
];

const CategoryFilter = ({
  categories = [],
  selectedCategory,
  onCategoryChange,
  stockStatus,
  onStockStatusChange,
  searchQuery,
  onSearchChange,
  loading = false,
}) => {
  return (
    <div className={styles.filterPanel}>
      <h3 className={styles.filterTitle}>Filters</h3>

      {/* Search Input */}
      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>Search Product</label>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Stock Status Filter */}
      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>Stock Status</label>
        <select
          className={styles.selectInput}
          value={stockStatus}
          onChange={(e) => onStockStatusChange(e.target.value)}
          disabled={loading}
        >
          {STOCK_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>Category</label>
        <div className={styles.categoryList}>
          <button
            type="button"
            className={`${styles.categoryBtn} ${!selectedCategory ? styles.active : ""}`}
            onClick={() => onCategoryChange("")}
            disabled={loading}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`${styles.categoryBtn} ${selectedCategory === cat.slug ? styles.active : ""}`}
              onClick={() => onCategoryChange(cat.slug)}
              disabled={loading}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {(selectedCategory || stockStatus || searchQuery) && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() => {
            onCategoryChange("");
            onStockStatusChange("");
            onSearchChange("");
          }}
          disabled={loading}
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};

export default CategoryFilter;
