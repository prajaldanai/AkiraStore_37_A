/**
 * Order Status Chart Component (Premium Redesign)
 * Donut chart with center total and clean legend
 */

import React from "react";
import SectionCard from "./SectionCard";
import styles from "./OrderStatusChart.module.css";

const STATUS_COLORS = {
  PLACED: "#6366f1",
  PROCESSING: "#f59e0b",
  SHIPPED: "#3b82f6",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
  placed: "#6366f1",
  processing: "#f59e0b",
  shipped: "#3b82f6",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

const OrderStatusChart = ({ data, loading }) => {
  if (loading) {
    return (
      <SectionCard title="Order Status">
        <div className={styles.skeleton}>
          <div className={styles.skeletonDonut}></div>
          <div className={styles.skeletonLegend}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.skeletonItem}></div>
            ))}
          </div>
        </div>
      </SectionCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <SectionCard title="Order Status">
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="16" stroke="#e5e7eb" strokeWidth="4"/>
            </svg>
          </div>
          <p className={styles.emptyTitle}>No order data available</p>
        </div>
      </SectionCard>
    );
  }

  // Calculate total
  const total = data.reduce((sum, d) => sum + d.count, 0);

  // Generate donut segments
  const generateDonutPath = (startAngle, endAngle, radius, innerRadius) => {
    const startX = 50 + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = 50 + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = 50 + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = 50 + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    const innerStartX = 50 + innerRadius * Math.cos((endAngle - 90) * Math.PI / 180);
    const innerStartY = 50 + innerRadius * Math.sin((endAngle - 90) * Math.PI / 180);
    const innerEndX = 50 + innerRadius * Math.cos((startAngle - 90) * Math.PI / 180);
    const innerEndY = 50 + innerRadius * Math.sin((startAngle - 90) * Math.PI / 180);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} L ${innerStartX} ${innerStartY} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEndX} ${innerEndY} Z`;
  };

  // Build segments
  let currentAngle = 0;
  const segments = data.map((item) => {
    const percentage = total > 0 ? (item.count / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const segment = {
      ...item,
      percentage: Math.round(percentage),
      path: percentage > 0 ? generateDonutPath(currentAngle, currentAngle + angle - 0.8, 42, 28) : "",
      color: STATUS_COLORS[item.status] || item.color || "#6b7280",
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <SectionCard title="Order Status">
      <div className={styles.chartContent}>
        {/* Donut Chart */}
        <div className={styles.donutWrapper}>
          <svg viewBox="0 0 100 100" className={styles.donutSvg}>
            {/* Background circle */}
            <circle cx="50" cy="50" r="35" fill="none" stroke="#f3f4f6" strokeWidth="14" />
            
            {/* Segments */}
            {segments.map((segment, i) => (
              segment.percentage > 0 && (
                <path
                  key={i}
                  d={segment.path}
                  fill={segment.color}
                  className={styles.donutSegment}
                />
              )
            ))}
          </svg>
          <div className={styles.donutCenter}>
            <span className={styles.totalCount}>{total}</span>
            <span className={styles.totalLabel}>Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          {segments.map((segment, i) => (
            <div key={i} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: segment.color }}></span>
              <span className={styles.legendLabel}>{segment.status}</span>
              <span className={styles.legendStats}>
                <span className={styles.legendCount}>{segment.count}</span>
                <span className={styles.legendPercent}>({segment.percentage}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
};

export default OrderStatusChart;
