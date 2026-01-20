import React, { useState, useEffect } from "react";
import { getAdminOrderById } from "../../services/adminOrderService";
import styles from "./AdminOrderDetailsModal.module.css";

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect fill='%23f0f0f0' width='50' height='50'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='8'%3ENo Image%3C/text%3E%3C/svg%3E";

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format currency
 */
const formatRs = (amount) => {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString("en-IN")}`;
};

/**
 * Get status badge class
 */
const getStatusClass = (status) => {
  const statusMap = {
    PLACED: styles.statusPlaced,
    PROCESSING: styles.statusProcessing,
    SHIPPED: styles.statusShipped,
    DELIVERED: styles.statusDelivered,
    CANCELLED: styles.statusCancelled,
  };
  return statusMap[status?.toUpperCase()] || styles.statusPlaced;
};

/**
 * Shorten order ID
 */
const shortenId = (id) => {
  if (!id) return "-";
  if (id.length <= 8) return id;
  return `...${id.slice(-8)}`;
};

export default function AdminOrderDetailsModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminOrderById(orderId);
      if (data.success) {
        setOrder(data.order);
      } else {
        setError("Failed to load order details");
      }
    } catch (err) {
      setError(err.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  // Handle click outside to close
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  /**
   * Render order timeline
   */
  const renderTimeline = () => {
    if (!order) return null;

    const isCancelled = order.status === "CANCELLED";
    
    const steps = [
      { key: "PLACED", label: "Placed", date: order.createdAt },
      { key: "PROCESSING", label: "Processing", date: order.processedAt },
      { key: "SHIPPED", label: "Shipped", date: order.shippedAt },
      { key: "DELIVERED", label: "Delivered", date: order.deliveredAt },
    ];

    const statusOrder = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED"];
    const currentIndex = statusOrder.indexOf(order.status);

    return (
      <div className={styles.timeline}>
        {steps.map((step, index) => {
          const isActive = index <= currentIndex && !isCancelled;
          const isCancelledStep = isCancelled && step.key === order.status;
          
          return (
            <div key={step.key} className={styles.timelineStep}>
              <div 
                className={`${styles.timelineDot} ${isActive ? styles.active : ""} ${isCancelledStep ? styles.cancelled : ""}`}
              >
                {isActive ? "✓" : index + 1}
              </div>
              <span className={styles.timelineLabel}>{step.label}</span>
              {step.date && (
                <span className={styles.timelineDate}>
                  {formatDate(step.date)} {formatTime(step.date)}
                </span>
              )}
            </div>
          );
        })}
        
        {isCancelled && (
          <div className={styles.timelineStep}>
            <div className={`${styles.timelineDot} ${styles.cancelled}`}>✕</div>
            <span className={styles.timelineLabel}>Cancelled</span>
            {order.cancelledAt && (
              <span className={styles.timelineDate}>
                {formatDate(order.cancelledAt)} {formatTime(order.cancelledAt)}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            Order Details
            {order && (
              <span className={styles.orderId}> #{shortenId(order.id)}</span>
            )}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {loading && (
            <div className={styles.loading}>Loading order details...</div>
          )}

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          {!loading && !error && order && (
            <>
              {/* Status */}
              <div className={styles.section}>
                <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
              </div>

              {/* Timeline */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Order Timeline</h3>
                {renderTimeline()}
              </div>

              {/* Customer Info */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Customer Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Name</span>
                    <span className={styles.infoValue}>{order.customer?.fullName}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>{order.customer?.email}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Phone</span>
                    <span className={styles.infoValue}>{order.customer?.phone}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Shipping Method</span>
                    <span className={styles.infoValue}>{order.shippingMethodLabel}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Address</span>
                    <span className={styles.infoValue}>
                      {order.customer?.address}, {order.customer?.city}, {order.customer?.province}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Order Items ({order.items?.length || 0})</h3>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Size</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, index) => (
                      <tr key={item.id || index} className={styles.itemRow}>
                        <td>
                          <div className={styles.itemDetails}>
                            <img 
                              src={item.productImage || PLACEHOLDER_IMAGE} 
                              alt={item.productName}
                              className={styles.itemImage}
                              onClick={() => item.productImage && setPreviewImage(item.productImage)}
                              style={{ cursor: item.productImage ? "pointer" : "default" }}
                              title={item.productImage ? "Click to view full image" : ""}
                              onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                            />
                            <span className={styles.itemName}>{item.productName}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.itemSize}>{item.size || "-"}</span>
                        </td>
                        <td>{item.quantity}</td>
                        <td>{formatRs(item.unitPrice)}</td>
                        <td>{formatRs(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Summary */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Order Summary</h3>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Subtotal</span>
                    <span className={styles.summaryValue}>{formatRs(order.subtotal)}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Shipping</span>
                    <span className={styles.summaryValue}>{formatRs(order.shippingCharge)}</span>
                  </div>
                  {order.giftBox && (
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Gift Box</span>
                      <span className={styles.summaryValue}>{formatRs(order.giftBoxFee)}</span>
                    </div>
                  )}
                  {order.bargainDiscount > 0 && (
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Bargain Discount</span>
                      <span className={styles.summaryValue}>-{formatRs(order.bargainDiscount)}</span>
                    </div>
                  )}
                  {order.taxAmount > 0 && (
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Tax</span>
                      <span className={styles.summaryValue}>{formatRs(order.taxAmount)}</span>
                    </div>
                  )}
                  <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                    <span className={styles.summaryLabel}>Total</span>
                    <span className={styles.summaryValue}>{formatRs(order.total)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className={styles.imagePreviewOverlay} 
          onClick={() => setPreviewImage(null)}
        >
          <div className={styles.imagePreviewContainer}>
            <button 
              className={styles.imagePreviewClose}
              onClick={() => setPreviewImage(null)}
            >
              ×
            </button>
            <img 
              src={previewImage} 
              alt="Product Preview" 
              className={styles.imagePreviewFull}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
