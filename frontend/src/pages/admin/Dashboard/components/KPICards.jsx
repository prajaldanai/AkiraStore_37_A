/**
 * KPI Cards Component
 * Four main metrics: Revenue, Orders, Products, Users
 */

import React from "react";
import styles from "./KPICards.module.css";

// Format currency with proper Indian locale (matching Sales Report format)
const formatCurrency = (value) => {
  const num = value || 0;
  if (num >= 100000) {
    return `Rs. ${(num / 100000).toFixed(2)}L`;
  }
  return `Rs. ${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

const formatNumber = (value) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

const KPICards = ({ kpis, loading }) => {
  const cards = [
    {
      id: "revenue",
      label: "Total Revenue",
      value: kpis?.totalRevenue || 0,
      format: formatCurrency,
      subLabel: "From delivered orders",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2V18M14 6C14 4.89543 12.2091 4 10 4C7.79086 4 6 4.89543 6 6C6 7.10457 7.79086 8 10 8C12.2091 8 14 8.89543 14 10C14 11.1046 12.2091 12 10 12C7.79086 12 6 11.1046 6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      color: "#10b981",
      bgColor: "#ecfdf5",
    },
    {
      id: "orders",
      label: "Total Orders",
      value: kpis?.totalOrders || 0,
      format: formatNumber,
      subLabel: `${kpis?.pendingOrders || 0} pending`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M16 6L10 2L4 6V14L10 18L16 14V6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M10 10V18M10 10L4 6M10 10L16 6" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
      color: "#6366f1",
      bgColor: "#eef2ff",
    },
    {
      id: "products",
      label: "Total Products",
      value: kpis?.totalProducts || 0,
      format: formatNumber,
      subLabel: `${kpis?.lowStockProducts || 0} low stock`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M7 5V3C7 2.44772 7.44772 2 8 2H12C12.5523 2 13 2.44772 13 3V5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M3 9H17" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
      color: "#f59e0b",
      bgColor: "#fffbeb",
    },
    {
      id: "users",
      label: "Total Users",
      value: kpis?.totalUsers || 0,
      format: formatNumber,
      subLabel: "Registered customers",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 18C4 14.6863 6.68629 12 10 12C13.3137 12 16 14.6863 16 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
    },
  ];

  if (loading) {
    return (
      <div className={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`${styles.card} ${styles.skeleton}`}>
            <div className={styles.skeletonIcon} />
            <div className={styles.skeletonText} />
            <div className={styles.skeletonValue} />
            <div className={styles.skeletonSub} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <div key={card.id} className={styles.card}>
          <div className={styles.iconWrapper} style={{ backgroundColor: card.bgColor }}>
            <span style={{ color: card.color }}>{card.icon}</span>
          </div>
          <span className={styles.label}>{card.label}</span>
          <span className={styles.value}>{card.format(card.value)}</span>
          <span className={styles.subLabel}>{card.subLabel}</span>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
