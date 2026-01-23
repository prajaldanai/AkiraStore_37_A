/**
 * Dashboard Header Component
 * Welcome message, date range selector, and quick actions
 */

import React from "react";
import styles from "./DashboardHeader.module.css";

const DashboardHeader = ({ salesDays, onChangeSalesPeriod, onRefresh, loading }) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = user.name || user.username || "Admin";

  return (
    <div className={styles.header}>
      <div className={styles.welcome}>
        <h2 className={styles.greeting}>Welcome back, {adminName} 👋</h2>
        <p className={styles.date}>{formattedDate}</p>
      </div>

      <div className={styles.actions}>
        {/* Period Toggle */}
        <div className={styles.periodToggle}>
          <button
            className={`${styles.periodBtn} ${salesDays === 7 ? styles.active : ""}`}
            onClick={() => onChangeSalesPeriod(7)}
          >
            7 Days
          </button>
          <button
            className={`${styles.periodBtn} ${salesDays === 30 ? styles.active : ""}`}
            onClick={() => onChangeSalesPeriod(30)}
          >
            30 Days
          </button>
        </div>

        {/* Refresh Button */}
        <button
          className={styles.refreshBtn}
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Data"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={loading ? styles.spinning : ""}
          >
            <path
              d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10.0503 2 11.8739 2.97518 13 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M13 1V4.5H9.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
