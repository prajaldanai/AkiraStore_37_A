/**
 * Low Stock Widget Component
 * List of products with low inventory
 */

import React from "react";
import styles from "./LowStockWidget.module.css";
import { buildImageUrl } from "../../../../utils/media";

const LowStockWidget = ({ products, loading }) => {
  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.skeletonTitle} />
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.skeletonItem} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Low Stock Alert</h3>
        {products?.length > 0 && (
          <span className={styles.badge}>{products.length}</span>
        )}
      </div>

      <div className={styles.list}>
        {!products || products.length === 0 ? (
          <div className={styles.empty}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="16" stroke="#d1d5db" strokeWidth="2"/>
              <path d="M20 12V22M20 26V28" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>All products are well stocked!</p>
          </div>
        ) : (
          products.slice(0, 5).map((product) => {
            const imageUrl = buildImageUrl(product.image);
            return (
              <div key={product.id} className={styles.item}>
                <div className={styles.productThumb}>
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
                        width="32"
                        height="32"
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

                <div className={styles.productInfo}>
                  <span className={styles.productName}>{product.name}</span>
                  <span className={styles.productCategory}>
                    {product.category || "Uncategorized"}
                  </span>
                  <span className={styles.productSku}>
                    SKU: {product.sku || `#${product.id}`}
                  </span>
                </div>

                <div className={styles.stockInfo}>
                  <span
                    className={`${styles.stockBadge} ${
                      product.stock === 0 ? styles.outOfStock : styles.lowStock
                    }`}
                  >
                    {product.stock === 0 ? "Out of Stock" : `${product.stock} left`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {products?.length > 5 && (
        <div className={styles.footer}>
          <button className={styles.viewAllBtn}>
            View all {products.length} items →
          </button>
        </div>
      )}
    </div>
  );
};

export default LowStockWidget;
