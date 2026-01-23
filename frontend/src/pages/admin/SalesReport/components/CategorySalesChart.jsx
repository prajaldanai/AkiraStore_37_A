/**
 * Category Sales Chart Component (Premium Redesign)
 * Horizontal bar chart with percentage share
 */

import React from "react";
import SectionCard from "./SectionCard";
import styles from "./CategorySalesChart.module.css";

const CategorySalesChart = ({ data, loading }) => {
  // Format currency
  const formatCurrency = (value) => {
    const num = value || 0;
    if (num >= 1000000) return `Rs. ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `Rs. ${(num / 1000).toFixed(1)}K`;
    return `Rs. ${num.toFixed(0)}`;
  };

  if (loading) {
    return (
      <SectionCard title="Sales by Category">
        <div className={styles.skeleton}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.skeletonRow}>
              <div className={styles.skeletonLabel}></div>
              <div className={styles.skeletonBar}></div>
              <div className={styles.skeletonValue}></div>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <SectionCard title="Sales by Category">
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="4" y="20" width="8" height="16" rx="2" fill="#e5e7eb"/>
              <rect x="16" y="12" width="8" height="24" rx="2" fill="#d1d5db"/>
              <rect x="28" y="8" width="8" height="28" rx="2" fill="#e5e7eb"/>
            </svg>
          </div>
          <p className={styles.emptyTitle}>No category data available</p>
        </div>
      </SectionCard>
    );
  }

  // Calculate totals for percentages
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  // Colors for bars
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316"];

  return (
    <SectionCard title="Sales by Category">
      <div className={styles.chartContent}>
        {data.map((cat, index) => {
          const percentage = totalRevenue > 0 ? ((cat.revenue / totalRevenue) * 100).toFixed(1) : 0;
          const barWidth = (cat.revenue / maxRevenue) * 100;
          const color = colors[index % colors.length];

          return (
            <div key={cat.id} className={styles.barRow}>
              <div className={styles.barHeader}>
                <div className={styles.categoryInfo}>
                  <span className={styles.colorDot} style={{ background: color }}></span>
                  <span className={styles.categoryName}>{cat.name}</span>
                </div>
                <div className={styles.stats}>
                  <span className={styles.percentage}>{percentage}%</span>
                  <span className={styles.revenue}>{formatCurrency(cat.revenue)}</span>
                </div>
              </div>
              <div className={styles.barTrack}>
                <div 
                  className={styles.barFill}
                  style={{ width: `${barWidth}%`, background: color }}
                ></div>
              </div>
              <div className={styles.meta}>
                <span>{cat.orders} orders</span>
                <span>·</span>
                <span>{cat.units} units</span>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default CategorySalesChart;
