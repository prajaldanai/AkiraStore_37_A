/**
 * Sales Report Page (Premium Redesign)
 * Modern SaaS-style analytics dashboard
 * Counts only DELIVERED orders as revenue
 */

import React from "react";

// Custom hook
import { useSalesReport } from "./hooks/useSalesReport";

// Components
import SalesReportTopbar from "./components/SalesReportTopbar";
import FiltersBar from "./components/FiltersBar";
import KPICards from "./components/KPICards";
import SalesTrendChart from "./components/SalesTrendChart";
import CategorySalesChart from "./components/CategorySalesChart";
import OrderStatusChart from "./components/OrderStatusChart";
import TopProductsTable from "./components/TopProductsTable";
import LowStockAlert from "./components/LowStockAlert";
import TopCustomersTable from "./components/TopCustomersTable";

// Styles
import styles from "./SalesReportPage.module.css";

// Global admin font lock - ensures consistent font sizing across all devices
import "../../../styles/adminGlobal.css";

const SalesReportPage = () => {
  const {
    reportData,
    categories,
    filters,
    updateFilters,
    resetFilters,
    setDatePreset,
    loading,
    error,
    refresh,
  } = useSalesReport();

  return (
    <div className={styles.page} data-admin="true">
      {/* Sticky Topbar */}
      <SalesReportTopbar
        lastUpdated={reportData?.generatedAt}
        onRefresh={refresh}
        loading={loading}
      />

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Filters */}
          <FiltersBar
            filters={filters}
            categories={categories}
            onFilterChange={updateFilters}
            onReset={resetFilters}
            onPresetSelect={setDatePreset}
            loading={loading}
          />

          {/* Error Banner */}
          {error && (
            <div className={styles.errorBanner}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 6V10.5M10 13.5V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className={styles.errorText}>{error}</span>
              <button className={styles.retryBtn} onClick={refresh}>
                Retry
              </button>
            </div>
          )}

          {/* KPI Cards */}
          <KPICards kpis={reportData?.kpis} loading={loading} />

          {/* Row 1: Sales Trend + Order Status */}
          <div className={styles.gridRow}>
            <div className={styles.colWide}>
              <SalesTrendChart 
                data={reportData?.salesTrend} 
                loading={loading} 
                dateRange={{ startDate: filters.startDate, endDate: filters.endDate }}
              />
            </div>
            <div className={styles.colNarrow}>
              <OrderStatusChart data={reportData?.orderStatusBreakdown} loading={loading} />
            </div>
          </div>

          {/* Row 2: Category Sales + Low Stock */}
          <div className={styles.gridRow}>
            <div className={styles.colWide}>
              <CategorySalesChart data={reportData?.categoryBreakdown} loading={loading} />
            </div>
            <div className={styles.colNarrow}>
              <LowStockAlert data={reportData?.lowStockProducts} loading={loading} />
            </div>
          </div>

          {/* Row 3: Top Products (Full Width) */}
          <div className={styles.fullWidth}>
            <TopProductsTable data={reportData?.topProducts} loading={loading} />
          </div>

          {/* Row 4: Top Customers (Full Width) */}
          <div className={styles.fullWidth}>
            <TopCustomersTable data={reportData?.topCustomers} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SalesReportPage;
