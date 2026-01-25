/**
 * Users Stats Component
 * Displays KPI cards for user management
 */

import React from "react";
import styles from "./UsersStats.module.css";

const UsersStats = ({ stats, loading }) => {
  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      color: "#6366f1",
      bgColor: "#eef2ff",
    },
    {
      label: "Total Logins",
      value: stats?.totalLogins || 0,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10,17 15,12 10,7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      ),
      color: "#10b981",
      bgColor: "#ecfdf5",
    },
    {
      label: "Suspended",
      value: stats?.suspendedCount || 0,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      ),
      color: "#f59e0b",
      bgColor: "#fffbeb",
    },
    {
      label: "Blocked",
      value: stats?.blockedCount || 0,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      color: "#ef4444",
      bgColor: "#fef2f2",
    },
  ];

  if (loading) {
    return (
      <div className={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.statCardSkeleton}>
            <div className={styles.skeletonIcon} />
            <div className={styles.skeletonText}>
              <div className={styles.skeletonValue} />
              <div className={styles.skeletonLabel} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.statsGrid}>
      {statCards.map((card, index) => (
        <div key={index} className={styles.statCard}>
          <div
            className={styles.iconWrapper}
            style={{ backgroundColor: card.bgColor, color: card.color }}
          >
            {card.icon}
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{card.value.toLocaleString()}</span>
            <span className={styles.statLabel}>{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UsersStats;
