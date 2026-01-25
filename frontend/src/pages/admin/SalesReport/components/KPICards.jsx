/**
 * KPI Cards Component (Premium Redesign)
 * Modern KPI cards with subtle tints, icons, and clean typography
 */

import React from "react";
import styles from "./KPICards.module.css";

const KPICards = ({ kpis, loading }) => {
  // Format currency with proper Indian locale
  const formatCurrency = (value) => {
    const num = value || 0;
    if (num >= 100000) {
      return `Rs. ${(num / 100000).toFixed(2)}L`;
    }
    return `Rs. ${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  };

  const cards = [
    {
      id: "totalSales",
      label: "Total Revenue",
      value: formatCurrency(kpis?.totalSales),
      helper: "Delivered orders",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 1.25V18.75M15 5H7.5C6.50544 5 5.55161 5.39509 4.84835 6.09835C4.14509 6.80161 3.75 7.75544 3.75 8.75C3.75 9.74456 4.14509 10.6984 4.84835 11.4017C5.55161 12.1049 6.50544 12.5 7.5 12.5H12.5C13.4946 12.5 14.4484 12.8951 15.1517 13.5983C15.8549 14.3016 16.25 15.2554 16.25 16.25C16.25 17.2446 15.8549 18.1984 15.1517 18.9017C14.4484 19.6049 13.4946 20 12.5 20H3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      tint: "green",
    },
    {
      id: "deliveredOrders",
      label: "Delivered Orders",
      value: kpis?.deliveredOrders || 0,
      helper: "Completed",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M16.875 6.25L10 10.625L3.125 6.25M10 10.625V18.75M17.5 13.75V6.25C17.5 5.91848 17.3683 5.60054 17.1339 5.36612C16.8995 5.1317 16.5815 5 16.25 5H3.75C3.41848 5 3.10054 5.1317 2.86612 5.36612C2.6317 5.60054 2.5 5.91848 2.5 6.25V13.75C2.5 14.0815 2.6317 14.3995 2.86612 14.6339C3.10054 14.8683 3.41848 15 3.75 15H16.25C16.5815 15 16.8995 14.8683 17.1339 14.6339C17.3683 14.3995 17.5 14.0815 17.5 13.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      tint: "blue",
    },
    {
      id: "avgOrderValue",
      label: "Avg Order Value",
      value: formatCurrency(kpis?.avgOrderValue),
      helper: "Per order",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M1.66669 10H18.3334M1.66669 10C1.66669 14.6024 5.39765 18.3333 10 18.3333M1.66669 10C1.66669 5.39763 5.39765 1.66667 10 1.66667M18.3334 10C18.3334 14.6024 14.6024 18.3333 10 18.3333M18.3334 10C18.3334 5.39763 14.6024 1.66667 10 1.66667M10 1.66667C12.0844 3.94864 13.269 6.91004 13.3334 10C13.269 13.09 12.0844 16.0514 10 18.3333M10 1.66667C7.91562 3.94864 6.73106 6.91004 6.66669 10C6.73106 13.09 7.91562 16.0514 10 18.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      tint: "purple",
    },
    {
      id: "cancelledOrders",
      label: "Cancelled",
      value: kpis?.cancelledOrders || 0,
      helper: "Orders cancelled",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12.5 7.5L7.5 12.5M7.5 7.5L12.5 12.5M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      tint: "red",
    },
    {
      id: "lowStockProducts",
      label: "Low Stock",
      value: kpis?.lowStockProducts || 0,
      helper: "Need attention",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 6.66667V10M10 13.3333H10.0083M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      tint: "amber",
    },
  ];

  if (loading) {
    return (
      <div className={styles.kpiGrid}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`${styles.kpiCard} ${styles.skeleton}`}>
            <div className={styles.skeletonIcon}></div>
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonLabel}></div>
              <div className={styles.skeletonValue}></div>
              <div className={styles.skeletonHelper}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.kpiGrid}>
      {cards.map((card) => (
        <div key={card.id} className={`${styles.kpiCard} ${styles[card.tint]}`}>
          <div className={styles.iconWrapper}>{card.icon}</div>
          <div className={styles.content}>
            <span className={styles.label}>{card.label}</span>
            <span className={styles.value}>{card.value}</span>
            <span className={styles.helper}>{card.helper}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
