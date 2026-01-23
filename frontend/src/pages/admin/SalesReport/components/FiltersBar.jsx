/**
 * Filters Bar Component (Premium Redesign)
 * Clean segmented control for date presets + date range + category dropdown
 */

import React, { useState } from "react";
import styles from "./FiltersBar.module.css";

const DATE_PRESETS = [
  { value: "7days", label: "7d" },
  { value: "30days", label: "30d" },
  { value: "90days", label: "90d" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisYear", label: "This Year" },
];

const FiltersBar = ({
  filters,
  categories,
  onFilterChange,
  onReset,
  onPresetSelect,
  loading,
}) => {
  const [activePreset, setActivePreset] = useState("30days");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handlePresetClick = (preset) => {
    setActivePreset(preset);
    onPresetSelect(preset);
  };

  const handleDateChange = (field, value) => {
    setActivePreset(null);
    onFilterChange({ [field]: value });
  };

  const handleCategoryChange = (e) => {
    onFilterChange({ categoryId: e.target.value });
  };

  const handleReset = () => {
    setActivePreset("30days");
    onReset();
  };

  return (
    <>
      {/* Mobile Filter Toggle */}
      <button
        className={styles.mobileToggle}
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4H14M4 8H12M6 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>Filters</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={showMobileFilters ? styles.chevronUp : ""}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={`${styles.filtersBar} ${showMobileFilters ? styles.mobileOpen : ""}`}>
        {/* Segmented Control for Presets */}
        <div className={styles.segmentedControl}>
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className={`${styles.segment} ${activePreset === preset.value ? styles.active : ""}`}
              onClick={() => handlePresetClick(preset.value)}
              disabled={loading}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className={styles.divider}></div>

        {/* Custom Date Range */}
        <div className={styles.dateRange}>
          <div className={styles.dateField}>
            <label className={styles.dateLabel}>From</label>
            <input
              type="date"
              className={styles.dateInput}
              value={filters.fromDate || ""}
              onChange={(e) => handleDateChange("fromDate", e.target.value)}
              disabled={loading}
            />
          </div>
          <div className={styles.dateField}>
            <label className={styles.dateLabel}>To</label>
            <input
              type="date"
              className={styles.dateInput}
              value={filters.toDate || ""}
              onChange={(e) => handleDateChange("toDate", e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* Category Dropdown */}
        <div className={styles.categoryWrapper}>
          <label className={styles.categoryLabel}>Category</label>
          <select
            className={styles.categorySelect}
            value={filters.categoryId || ""}
            onChange={handleCategoryChange}
            disabled={loading}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Reset Button */}
        <button type="button" className={styles.resetBtn} onClick={handleReset} disabled={loading}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1.75 7C1.75 4.1005 4.1005 1.75 7 1.75C8.67025 1.75 10.1522 2.52225 11.0833 3.72917M12.25 7C12.25 9.8995 9.8995 12.25 7 12.25C5.32975 12.25 3.8478 11.4777 2.91667 10.2708" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            <path d="M8.75 3.5H11.375V0.875" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.25 10.5H2.625V13.125" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Reset
        </button>
      </div>
    </>
  );
};

export default FiltersBar;
