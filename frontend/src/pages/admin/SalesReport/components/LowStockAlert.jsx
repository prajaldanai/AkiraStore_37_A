/**
 * Low Stock Alert Component (Premium Redesign)
 * Clean alert widget with navigation to inventory
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import SectionCard from "./SectionCard";
import styles from "./LowStockAlert.module.css";

const LowStockAlert = ({ data, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <SectionCard title="Low Stock Alert">
        <div className={styles.skeleton}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonItem}></div>
          ))}
        </div>
      </SectionCard>
    );
  }

  // All good state
  if (!data || data.length === 0) {
    return (
      <SectionCard title="Stock Status">
        <div className={styles.allGood}>
          <div className={styles.allGoodIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="#ecfdf5"/>
              <path d="M10 16L14 20L22 12" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className={styles.allGoodTitle}>All products well stocked</p>
          <p className={styles.allGoodHint}>No items need restocking</p>
        </div>
      </SectionCard>
    );
  }

  // Header action button
  const headerAction = (
    <button 
      className={styles.headerBtn}
      onClick={() => navigate("/admin/inventory")}
    >
      Go to Inventory →
    </button>
  );

  return (
    <SectionCard 
      title="Low Stock Alert" 
      subtitle={`${data.length} items`}
      headerRight={headerAction}
    >
      <div className={styles.itemsList}>
        {data.slice(0, 5).map((product) => (
          <div key={product.productId} className={styles.item}>
            {product.image ? (
              <img src={product.image} alt={product.name} className={styles.itemImage} />
            ) : (
              <div className={styles.noImage}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
            )}
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{product.name}</span>
              <span className={styles.itemCategory}>{product.category}</span>
            </div>
            <div className={styles.stockBadge}>
              <span className={styles.stockCount}>{product.stock}</span>
              <span className={styles.stockLabel}>left</span>
            </div>
          </div>
        ))}
      </div>

      {data.length > 5 && (
        <button 
          className={styles.viewMore}
          onClick={() => navigate("/admin/inventory")}
        >
          View all {data.length} items
        </button>
      )}
    </SectionCard>
  );
};

export default LowStockAlert;
