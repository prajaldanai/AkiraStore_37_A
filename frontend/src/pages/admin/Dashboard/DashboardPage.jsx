/**
 * Admin Dashboard Page
 * Premium SaaS-style data-driven dashboard
 */

import React from "react";
import { AdminLayout } from "../../../components/admin/layout";
import { useDashboardData } from "./hooks/useDashboardData";
import {
  DashboardHeader,
  KPICards,
  SalesOverviewChart,
  OrderStatusWidget,
  LowStockWidget,
  TopProductsWidget,
  RecentOrdersTable,
  QuickActions,
} from "./components";
import styles from "./DashboardPage.module.css";

const DashboardPage = () => {
  const { data, loading, error, salesDays, changeSalesPeriod, refresh } =
    useDashboardData();

  if (error) {
    return (
      <AdminLayout pageTitle="Dashboard">
        <div className={styles.error}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="#ef4444" strokeWidth="2" />
            <path
              d="M24 16V26M24 32V34"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h3>Failed to load dashboard</h3>
          <p>{error}</p>
          <button onClick={refresh} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Dashboard">
      <div className={styles.dashboard}>
        {/* Header with welcome message and period toggle */}
        <DashboardHeader
          salesDays={salesDays}
          onChangeSalesPeriod={changeSalesPeriod}
          onRefresh={refresh}
          loading={loading}
        />

        {/* KPI Cards Row */}
        <KPICards kpis={data?.kpis} loading={loading} />

        {/* Main Content Grid */}
        <div className={styles.mainGrid}>
          {/* Sales Overview Chart - Full width */}
          <div className={styles.chartSection}>
            <SalesOverviewChart
              salesData={data?.salesOverview}
              salesDays={salesDays}
              loading={loading}
            />
          </div>

          {/* Two Column Layout for Widgets */}
          <div className={styles.widgetGrid}>
            <div className={styles.widgetColumn}>
              <OrderStatusWidget
                statusBreakdown={data?.orderStatus?.breakdown}
                loading={loading}
              />
            </div>
            <div className={styles.widgetColumn}>
              <LowStockWidget products={data?.lowStock} loading={loading} />
            </div>
          </div>

          {/* Top Products */}
          <div className={styles.topProductsSection}>
            <TopProductsWidget products={data?.topProducts} loading={loading} />
          </div>

          {/* Recent Orders and Quick Actions */}
          <div className={styles.bottomGrid}>
            <div className={styles.recentOrdersSection}>
              <RecentOrdersTable orders={data?.recentOrders} loading={loading} />
            </div>
            <div className={styles.quickActionsSection}>
              <QuickActions />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
