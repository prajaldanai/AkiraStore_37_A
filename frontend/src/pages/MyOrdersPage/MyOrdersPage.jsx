import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMyOrders } from "../../services/buyNowService";
import Layout from "../../components/Layout/Layout";
import styles from "./MyOrdersPage.module.css";

// Fallback placeholder image
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect fill='%23f0f0f0' width='60' height='60'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E";

/**
 * Helper to safely parse numbers
 */
const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

/**
 * Format currency in Rs.
 */
const formatRs = (amount) => {
  const num = safeNumber(amount);
  return `Rs. ${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

/**
 * Format date nicely
 */
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format time
 */
const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Shorten order ID for display
 */
const shortenOrderId = (orderId) => {
  if (!orderId) return "-";
  if (orderId.length <= 8) return orderId;
  return `...${orderId.slice(-8)}`;
};

/**
 * Get status badge styling
 */
const getStatusInfo = (status) => {
  const statusLower = status?.toLowerCase() || "";
  
  switch (statusLower) {
    case "confirmed":
    case "placed":
      return { label: "CONFIRMED", className: styles.statusConfirmed };
    case "processing":
      return { label: "PROCESSING", className: styles.statusProcessing };
    case "shipped":
      return { label: "SHIPPED", className: styles.statusShipped };
    case "delivered":
      return { label: "DELIVERED", className: styles.statusDelivered };
    case "cancelled":
      return { label: "CANCELLED", className: styles.statusCancelled };
    case "pending_confirmation":
    case "pending":
      return { label: "PENDING", className: styles.statusPending };
    default:
      return { label: status?.toUpperCase() || "UNKNOWN", className: styles.statusDefault };
  }
};

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightOrderId = searchParams.get("highlight");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    // ProtectedRoute already ensures user is authenticated
    // Just fetch orders directly
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyOrders({ page, limit: 10 });
      if (data.success) {
        setOrders(data.orders || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } else {
        setError("Failed to load orders");
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      // Check if it's an auth error - redirect to login
      if (err.message?.includes("Access denied") || err.message?.includes("token") || err.message?.includes("Authentication")) {
        // Token might be expired - clear it and redirect to login
        localStorage.removeItem("authToken");
        navigate("/login", { state: { from: "/orders" }, replace: true });
      } else {
        setError(err.message || "Failed to load orders");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const handleContinueShopping = () => {
    navigate("/dashboard");
  };

  const handleRetry = () => {
    fetchOrders();
  };

  // Loading skeleton
  if (loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>My Orders</h1>
          <div className={styles.ordersList}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonImage}></div>
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonLine}></div>
                  <div className={styles.skeletonLineShort}></div>
                  <div className={styles.skeletonLineShort}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>My Orders</h1>
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryButton} onClick={handleRetry}>
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>My Orders</h1>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>No orders yet</h2>
            <p className={styles.emptyText}>
              You haven't placed any orders yet. Start shopping to see your orders here!
            </p>
            <button className={styles.shopButton} onClick={handleContinueShopping}>
              Continue Shopping
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h1 className={styles.pageTitle}>My Orders</h1>
          <span className={styles.orderCount}>{pagination.total} order{pagination.total !== 1 ? 's' : ''}</span>
        </div>

        <div className={styles.ordersList}>
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const isHighlighted = highlightOrderId === order.id;

            return (
              <div 
                key={order.id} 
                className={`${styles.orderCard} ${isHighlighted ? styles.highlighted : ''}`}
              >
                {/* Left: Product Preview */}
                <div className={styles.productPreview}>
                  <img
                    src={order.productImage || PLACEHOLDER_IMAGE}
                    alt={order.productName || "Product"}
                    className={styles.productImage}
                    onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                  />
                </div>

                {/* Middle: Order Info */}
                <div className={styles.orderInfo}>
                  <div className={styles.orderHeader}>
                    <span className={styles.orderId}>
                      Order #{shortenOrderId(order.id)}
                    </span>
                    <span className={`${styles.statusBadge} ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className={styles.productName}>
                    {order.productName || "Unknown Product"}
                    {safeNumber(order.quantity) > 1 && (
                      <span className={styles.quantityBadge}>×{order.quantity}</span>
                    )}
                  </div>

                  <div className={styles.orderMeta}>
                    <span className={styles.orderDate}>
                      {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                    </span>
                    {order.selectedSize && (
                      <span className={styles.orderSize}>Size: {order.selectedSize}</span>
                    )}
                  </div>

                  {/* Tags */}
                  <div className={styles.orderTags}>
                    {order.giftBox && (
                      <span className={styles.tag}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.tagIcon}>
                          <rect x="3" y="8" width="18" height="13" rx="1" />
                          <path d="M12 8v13M3 12h18M7.5 8a3 3 0 0 1 0-6 3 3 0 0 0 4.5 2.6A3 3 0 0 0 16.5 2a3 3 0 0 1 0 6" />
                        </svg>
                        Gift Box
                      </span>
                    )}
                    {safeNumber(order.bargainDiscount) > 0 && (
                      <span className={styles.tagDiscount}>
                        -{formatRs(order.bargainDiscount)} Bargain
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Price & Action */}
                <div className={styles.orderActions}>
                  <div className={styles.priceSection}>
                    <span className={styles.totalLabel}>Total</span>
                    <span className={styles.totalPrice}>{formatRs(order.total)}</span>
                    {safeNumber(order.shippingCharge) > 0 && (
                      <span className={styles.shippingInfo}>
                        +{formatRs(order.shippingCharge)} shipping
                      </span>
                    )}
                  </div>
                  <button
                    className={styles.viewButton}
                    onClick={() => handleViewDetails(order.id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageButton}
              disabled={pagination.page <= 1}
              onClick={() => fetchOrders(pagination.page - 1)}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className={styles.pageButton}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchOrders(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyOrdersPage;
