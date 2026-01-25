/**
 * Sales Trend Chart Component (Premium Redesign)
 * Area chart matching Dashboard SalesOverviewChart style
 */

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./SalesTrendChart.module.css";

const formatCurrency = (value) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(0)}K`;
  }
  return `₹${value}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        <p className={styles.tooltipValue}>
          Revenue: ₹{payload[0].value.toLocaleString("en-IN")}
        </p>
        <p className={styles.tooltipOrders}>
          Orders: {payload[0].payload.orders}
        </p>
      </div>
    );
  }
  return null;
};

const SalesTrendChart = ({ data, loading, dateRange }) => {
  // Transform data for chart
  const chartData = data?.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: parseFloat(item.revenue) || 0,
    orders: item.orders || 0,
  })) || [];

  // Calculate totals
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate date range label
  const getDaysLabel = () => {
    if (dateRange?.startDate && dateRange?.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `Last ${diffDays} days performance`;
    }
    return `${chartData.length} days performance`;
  };

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
        <div>
          <h3 className={styles.title}>Sales Overview</h3>
          <p className={styles.subtitle}>{getDaysLabel()}</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>₹{totalRevenue.toLocaleString("en-IN")}</span>
            <span className={styles.statLabel}>TOTAL REVENUE</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalOrders}</span>
            <span className={styles.statLabel}>ORDERS</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>₹{avgOrderValue.toFixed(2)}</span>
            <span className={styles.statLabel}>AVG. ORDER</span>
          </div>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        {chartData.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M6 36L18 24L26 32L42 12" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M30 12H42V24" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className={styles.emptyTitle}>No sales data available</p>
            <p className={styles.emptyHint}>Try adjusting your date range or filters</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenueTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                tickFormatter={formatCurrency}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenueTrend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SalesTrendChart;
