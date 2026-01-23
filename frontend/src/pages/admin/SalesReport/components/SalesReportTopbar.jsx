/**
 * Sales Report Topbar Component
 * Sticky header with back button, title, refresh, and last updated time
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SalesReportTopbar.module.css";

const SalesReportTopbar = ({ lastUpdated, onRefresh, loading }) => {
  const navigate = useNavigate();

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button
          className={styles.backBtn}
          onClick={() => navigate("/admin-dashboard")}
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Sales Report</h1>
          <span className={styles.subtitle}>Delivered orders only</span>
        </div>
      </div>

      <div className={styles.right}>
        {lastUpdated && (
          <span className={styles.lastUpdated}>
            Updated {formatTime(lastUpdated)}
          </span>
        )}
        <button
          className={styles.refreshBtn}
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh data"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={loading ? styles.spinning : ""}
          >
            <path
              d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.0503 2 11.8563 3.00442 13 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M10 4.5H13.25V1.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
};

export default SalesReportTopbar;
