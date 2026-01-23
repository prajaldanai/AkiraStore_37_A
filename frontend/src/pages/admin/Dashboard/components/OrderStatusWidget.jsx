/**
 * Order Status Widget Component
 * Donut chart showing order status breakdown
 */

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import styles from "./OrderStatusWidget.module.css";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{data.label}</p>
        <p className={styles.tooltipValue}>{data.count} orders</p>
        <p className={styles.tooltipPercent}>{data.percentage}%</p>
      </div>
    );
  }
  return null;
};

const OrderStatusWidget = ({ statusBreakdown, loading }) => {
  // Transform data for chart - backend already provides formatted data with colors
  const totalOrders = statusBreakdown?.reduce((sum, item) => sum + item.count, 0) || 0;

  const chartData = statusBreakdown?.map((item) => {
    return {
      status: item.status,
      label: item.status,
      count: item.count,
      color: item.color,
      percentage: totalOrders > 0 ? ((item.count / totalOrders) * 100).toFixed(1) : 0,
    };
  }) || [];

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.skeletonTitle} />
        </div>
        <div className={styles.skeletonChart} />
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Order Status</h3>
      </div>

      <div className={styles.content}>
        <div className={styles.chartContainer}>
          {chartData.length === 0 ? (
            <div className={styles.empty}>
              <p>No order data available</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="count"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.centerLabel}>
                <span className={styles.centerValue}>{totalOrders}</span>
                <span className={styles.centerText}>Total</span>
              </div>
            </>
          )}
        </div>

        <div className={styles.legend}>
          {chartData.map((item) => (
            <div key={item.status} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
              <span className={styles.legendLabel}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusWidget;
