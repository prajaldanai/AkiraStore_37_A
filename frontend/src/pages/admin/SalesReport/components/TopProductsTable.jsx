/**
 * Top Products Table Component (Premium Redesign)
 * Clean table with stock badges and hover effects
 */

import React, { useState } from "react";
import SectionCard from "./SectionCard";
import styles from "./TopProductsTable.module.css";

const ITEMS_PER_PAGE = 10;

const TopProductsTable = ({ data, loading }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Format currency
  const formatCurrency = (value) => {
    return `Rs. ${(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  // Get stock status
  const getStockStatus = (stock, isLowStock) => {
    if (stock === 0) return { label: "Out", className: styles.stockOut };
    if (isLowStock || stock <= 5) return { label: stock, className: styles.stockLow };
    return { label: stock, className: styles.stockOk };
  };

  if (loading) {
    return (
      <SectionCard title="Top Selling Products" noPadding>
        <div className={styles.skeleton}>
          <div className={styles.skeletonHeader}></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.skeletonRow}>
              <div className={styles.skeletonCell} style={{ width: "40%" }}></div>
              <div className={styles.skeletonCell} style={{ width: "15%" }}></div>
              <div className={styles.skeletonCell} style={{ width: "15%" }}></div>
              <div className={styles.skeletonCell} style={{ width: "15%" }}></div>
              <div className={styles.skeletonCell} style={{ width: "10%" }}></div>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <SectionCard title="Top Selling Products">
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M10 35V10L20 5L30 10V35L20 30L10 35Z" stroke="#e5e7eb" strokeWidth="2" fill="none"/>
              <path d="M20 5V30" stroke="#e5e7eb" strokeWidth="2"/>
            </svg>
          </div>
          <p className={styles.emptyTitle}>No product sales data</p>
          <p className={styles.emptyHint}>Sales will appear here once orders are delivered</p>
        </div>
      </SectionCard>
    );
  }

  // Pagination
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <SectionCard 
      title="Top Selling Products" 
      subtitle={`${data.length} products`}
      noPadding
    >
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thProduct}>Product</th>
              <th className={styles.thCategory}>Category</th>
              <th className={styles.thUnits}>Units</th>
              <th className={styles.thRevenue}>Revenue</th>
              <th className={styles.thStock}>Stock</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((product, index) => {
              const stockStatus = getStockStatus(product.stock, product.isLowStock);
              const rank = startIndex + index + 1;
              
              return (
                <tr key={product.productId} className={styles.row}>
                  <td className={styles.tdProduct}>
                    <span className={`${styles.rank} ${rank <= 3 ? styles[`rank${rank}`] : ""}`}>
                      {rank}
                    </span>
                    {product.image ? (
                      <img src={product.image} alt={product.name} className={styles.productImage} />
                    ) : (
                      <div className={styles.noImage}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <circle cx="5.5" cy="5.5" r="1.5" fill="currentColor"/>
                          <path d="M2 11L5 8L7 10L11 6L14 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                    )}
                    <span className={styles.productName}>{product.name}</span>
                  </td>
                  <td className={styles.tdCategory}>
                    <span className={styles.categoryBadge}>{product.category}</span>
                  </td>
                  <td className={styles.tdUnits}>{product.unitsSold}</td>
                  <td className={styles.tdRevenue}>{formatCurrency(product.revenue)}</td>
                  <td className={styles.tdStock}>
                    <span className={`${styles.stockBadge} ${stockStatus.className}`}>
                      {stockStatus.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ← Prev
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </SectionCard>
  );
};

export default TopProductsTable;
