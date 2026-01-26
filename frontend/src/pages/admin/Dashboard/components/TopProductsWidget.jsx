/**
 * Top Products Widget Component
 * Best selling products table
 */

import React from "react";
import styles from "./TopProductsWidget.module.css";
import { buildImageUrl } from "../../../../utils/media";

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
              {products.slice(0, 5).map((product, index) => {
                const imageUrl = buildImageUrl(product.image);
                return (
                  <tr key={product.id || index}>
                    <td className={styles.tdProduct}>
                      <span className={styles.rank}>#{index + 1}</span>
                      <div className={styles.productPreview}>
                        <div className={styles.productImageWrapper}>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className={styles.productImage}
                              loading="lazy"
                            />
                          ) : (
                            <div className={styles.productImagePlaceholder}>
                              <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              >
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M5 15l3-3 2 2 5-5 4 4" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className={styles.productMeta}>
                          <span className={styles.productName}>{product.name}</span>
                          <span className={styles.productCategory}>
                            {product.category || "Uncategorized"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.tdRight}>
                      <span className={styles.sold}>{product.unitsSold || 0}</span>
                    </td>
                    <td className={styles.tdRight}>
                      <span className={styles.revenue}>
                        Rs. {(product.revenue || 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TopProductsWidget;
