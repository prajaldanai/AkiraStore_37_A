/**
 * Top Products Widget Component
 * Best selling products table
 */

import React from "react";
import styles from "./TopProductsWidget.module.css";

const TopProductsWidget = ({ products, loading }) => {
  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonTable}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Top Products</h3>
        <span className={styles.subtitle}>Best sellers this month</span>
      </div>

      <div className={styles.tableWrapper}>
        {!products || products.length === 0 ? (
          <div className={styles.empty}>No product data available</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thProduct}>Product</th>
                <th className={styles.thRight}>Sold</th>
                <th className={styles.thRight}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 5).map((product, index) => (
                <tr key={product.id || index}>
                  <td className={styles.tdProduct}>
                    <span className={styles.rank}>#{index + 1}</span>
                    <span className={styles.productName}>{product.name}</span>
                  </td>
                  <td className={styles.tdRight}>
                    <span className={styles.sold}>{product.totalSold || 0}</span>
                  </td>
                  <td className={styles.tdRight}>
                    <span className={styles.revenue}>
                      Rs. {(product.totalRevenue || 0).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TopProductsWidget;
