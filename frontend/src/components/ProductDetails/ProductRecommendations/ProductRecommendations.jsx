import React from "react";
import ProductSlider from "../../Product/ProductSlider";
import styles from "./ProductRecommendations.module.css";

export default function ProductRecommendations({ items = [] }) {
  // Show up to 6 recommendations for slider functionality
  const displayItems = Array.isArray(items) ? items.slice(0, 6) : [];
  
  if (displayItems.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Recommended for You</h2>
      </div>
      <p className={styles.subtitle}>
        Products selected based on your preferences and recent activity.
      </p>
      <ProductSlider items={displayItems} />
    </section>
  );
}