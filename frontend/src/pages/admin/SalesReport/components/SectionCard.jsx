/**
 * Section Card Component
 * Reusable wrapper for charts and tables with consistent styling
 */

import React from "react";
import styles from "./SectionCard.module.css";

const SectionCard = ({ 
  title, 
  subtitle,
  headerRight,
  children, 
  className = "",
  noPadding = false,
}) => {
  return (
    <div className={`${styles.card} ${className}`}>
      {(title || headerRight) && (
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
          </div>
          {headerRight && (
            <div className={styles.headerRight}>{headerRight}</div>
          )}
        </div>
      )}
      <div className={`${styles.content} ${noPadding ? styles.noPadding : ""}`}>
        {children}
      </div>
    </div>
  );
};

export default SectionCard;
