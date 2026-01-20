import React from "react";
import styles from "./ProductFeatures.module.css";

export default function ProductFeatures({ features }) {
  const hasFeatures = Array.isArray(features) && features.length > 0;

  if (!hasFeatures) {
    return (
      <section className={styles.featuresSection}>
        <h3 className={styles.title}>Features</h3>
        <p className={styles.noData}>No features available.</p>
      </section>
    );
  }

  return (
    <section className={styles.featuresSection}>
      <h3 className={styles.title}>Features</h3>
      <ul className={styles.featureList}>
        {features.map((feature, idx) => (
          <li key={idx} className={styles.featureItem}>
            <span className={styles.emoji}>✅</span>
            <span className={styles.text}>{feature}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}