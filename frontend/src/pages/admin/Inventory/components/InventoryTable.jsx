/**
 * InventoryTable Component
 * Displays products list with stock management
 */

import React from "react";
import StockStepper from "./StockStepper";
import styles from "./InventoryTable.module.css";

const BASE_URL = "http://localhost:5000";

const InventoryTable = ({
  products = [],
  onAdjustStock,
  loading = false,
}) => {
  // Build full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    let path = imagePath.replace(/\\/g, "/");
    if (!path.startsWith("/uploads")) {
      path = `/uploads/${path.replace(/^\//, "")}`;
    }
    return `${BASE_URL}${path}`;
  };

  // Get stock status badge class
  const getStockBadgeClass = (stockStatus) => {
    switch (stockStatus) {
      case "out_of_stock":
        return styles.outOfStock;
      case "low_stock":
        return styles.lowStock;
      case "in_stock":
      default:
        return styles.inStock;
    }
  };

  // Format stock status label
  const getStockLabel = (stockStatus) => {
    switch (stockStatus) {
      case "out_of_stock":
        return "Out of Stock";
      case "low_stock":
        return "Low Stock";
      case "in_stock":
      default:
        return "In Stock";
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading inventory...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyText}>No products found</p>
        <p className={styles.emptySubtext}>Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thImage}>Image</th>
            <th className={styles.thName}>Product Name</th>
            <th className={styles.thCategory}>Category</th>
            <th className={styles.thPrice}>Price</th>
            <th className={styles.thStatus}>Status</th>
            <th className={styles.thStock}>Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className={styles.row}>
              <td className={styles.tdImage}>
                {product.image ? (
                  <img
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    className={styles.productImage}
                  />
                ) : (
                  <div className={styles.noImage}>No Image</div>
                )}
              </td>
              <td className={styles.tdName}>
                <span className={styles.productName}>{product.name}</span>
                <span className={styles.productId}>ID: {product.id}</span>
              </td>
              <td className={styles.tdCategory}>
                {product.category?.name || "—"}
              </td>
              <td className={styles.tdPrice}>
                Rs. {product.price?.toLocaleString() || "0"}
              </td>
              <td className={styles.tdStatus}>
                <span className={`${styles.statusBadge} ${getStockBadgeClass(product.stockStatus)}`}>
                  {getStockLabel(product.stockStatus)}
                </span>
              </td>
              <td className={styles.tdStock}>
                <StockStepper
                  stock={product.stock}
                  onIncrease={() => onAdjustStock(product.id, 1)}
                  onDecrease={() => onAdjustStock(product.id, -1)}
                  loading={loading}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
