/**
 * StockStepper Component
 * +/- buttons to adjust stock quantity
 */

import React, { useState } from "react";
import styles from "./StockStepper.module.css";

const StockStepper = ({ 
  stock, 
  onIncrease, 
  onDecrease, 
  loading = false,
  disabled = false 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDecrease = async () => {
    if (stock <= 0 || isUpdating || disabled) return;
    
    setIsUpdating(true);
    try {
      await onDecrease();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrease = async () => {
    if (isUpdating || disabled) return;
    
    setIsUpdating(true);
    try {
      await onIncrease();
    } finally {
      setIsUpdating(false);
    }
  };

  const isLoading = loading || isUpdating;

  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={`${styles.stepBtn} ${styles.decreaseBtn}`}
        onClick={handleDecrease}
        disabled={stock <= 0 || isLoading || disabled}
        title="Decrease stock"
      >
        −
      </button>
      
      <span className={`${styles.stockValue} ${isLoading ? styles.loading : ""}`}>
        {isLoading ? "..." : stock}
      </span>
      
      <button
        type="button"
        className={`${styles.stepBtn} ${styles.increaseBtn}`}
        onClick={handleIncrease}
        disabled={isLoading || disabled}
        title="Increase stock"
      >
        +
      </button>
    </div>
  );
};

export default StockStepper;
