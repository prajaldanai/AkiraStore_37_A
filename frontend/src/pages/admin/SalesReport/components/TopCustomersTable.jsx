/**
 * Top Customers Table Component (Premium Redesign)
 * Clean table with ranking badges
 */

import React from "react";
import SectionCard from "./SectionCard";
import styles from "./TopCustomersTable.module.css";

const TopCustomersTable = ({ data, loading }) => {
  // Format currency
  const formatCurrency = (value) => {
    return `Rs. ${(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <SectionCard title="Top Customers" noPadding>
        <div className={styles.skeleton}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.skeletonRow}></div>
          ))}
        </div>
      </SectionCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <SectionCard title="Top Customers">
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="14" r="6" stroke="#e5e7eb" strokeWidth="2"/>
              <path d="M8 34C8 27.3726 13.3726 22 20 22C26.6274 22 32 27.3726 32 34" stroke="#e5e7eb" strokeWidth="2"/>
            </svg>
          </div>
          <p className={styles.emptyTitle}>No customer data available</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Top Customers" subtitle={`${data.length} customers`} noPadding>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thRank}>#</th>
              <th className={styles.thCustomer}>Customer</th>
              <th className={styles.thOrders}>Orders</th>
              <th className={styles.thSpent}>Spent</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((customer, index) => (
              <tr key={customer.email} className={styles.row}>
                <td className={styles.tdRank}>
                  <span className={`${styles.rank} ${index < 3 ? styles[`rank${index + 1}`] : ""}`}>
                    {index + 1}
                  </span>
                </td>
                <td className={styles.tdCustomer}>
                  <div className={styles.avatar}>
                    {(customer.name || customer.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.customerInfo}>
                    <span className={styles.customerName}>{customer.name || "Guest"}</span>
                    <span className={styles.customerEmail}>{customer.email}</span>
                  </div>
                </td>
                <td className={styles.tdOrders}>{customer.orderCount}</td>
                <td className={styles.tdSpent}>{formatCurrency(customer.totalSpent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};

export default TopCustomersTable;
