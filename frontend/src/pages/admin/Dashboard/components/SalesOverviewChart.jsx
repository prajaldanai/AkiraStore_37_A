/**
 * Sales Overview Chart Component
 * Area chart showing revenue trends
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
import styles from "./SalesOverviewChart.module.css";

const formatCurrency = (value) => {
  if (value >= 100000) {
    return `Rs. ${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `Rs. ${(value / 1000).toFixed(0)}K`;
  }
  return `Rs. ${value}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        <p className={styles.tooltipValue}>
          Revenue: Rs. {payload[0].value.toLocaleString("en-IN")}
        </p>
        <p className={styles.tooltipOrders}>
          Orders: {payload[0].payload.orders}
        </p>
      </div>
    );
  }
  return null;
};

const SalesOverviewChart = ({ salesData, salesDays, loading }) => {
  // Transform data for chart - backend returns 'trend' not 'dailySales'
  const chartData = salesData?.trend?.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: parseFloat(item.revenue) || 0,
    orders: item.orders || 0,
  })) || [];

  // Use totals from backend if available, otherwise calculate
  const totalRevenue = salesData?.totalRevenue || chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = salesData?.totalOrders || chartData.reduce((sum, item) => sum + item.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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
          <p className={styles.subtitle}>Last {salesDays} days performance</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>Rs. {totalRevenue.toLocaleString("en-IN")}</span>
            <span className={styles.statLabel}>TOTAL REVENUE</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalOrders}</span>
            <span className={styles.statLabel}>ORDERS</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>Rs. {avgOrderValue.toFixed(2)}</span>
            <span className={styles.statLabel}>AVG. ORDER</span>
          </div>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        {chartData.length === 0 ? (
          <div className={styles.empty}>
            <p>No sales data available for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SalesOverviewChart;
