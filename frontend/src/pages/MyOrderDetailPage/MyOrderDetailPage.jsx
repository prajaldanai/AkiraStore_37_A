import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMyOrderById } from "../../services/buyNowService";
import Layout from "../../components/Layout/Layout";
import styles from "./MyOrderDetailPage.module.css";

// Fallback placeholder image
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23f0f0f0' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";

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
  return `Rs.${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

/**
 * Format date
 */
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Get status badge class
 */
const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
    case "delivered":
      return styles.statusSuccess;
    case "processing":
    case "shipped":
      return styles.statusProcessing;
    case "pending_confirmation":
    case "pending":
      return styles.statusPending;
    case "cancelled":
      return styles.statusCancelled;
    default:
      return styles.statusDefault;
  }
};

const MyOrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await getMyOrderById(orderId);
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError("Order not found");
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
        if (err.message?.includes("Access denied")) {
          setError("You don't have permission to view this order");
        } else {
          setError(err.message || "Failed to load order details");
        }
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleBack = () => {
    navigate("/orders");
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleGoToOrders = () => {
    navigate("/orders");
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.loadingState}>Loading order details...</div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <p>{error}</p>
            <div className={styles.errorButtons}>
              <button onClick={handleGoToOrders} className={styles.homeBtn}>
                Back to Orders
              </button>
              <button onClick={handleGoToDashboard} className={styles.homeBtnSecondary}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // No order found
  if (!order) {
    return (
      <Layout>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <p>Order not found</p>
            <div className={styles.errorButtons}>
              <button onClick={handleGoToOrders} className={styles.homeBtn}>
                Back to Orders
              </button>
              <button onClick={handleGoToDashboard} className={styles.homeBtnSecondary}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Extract data
  const items = order.items || [];
  const customer = order.customer || {};
  const subtotal = safeNumber(order.subtotal);
  const shippingCharge = safeNumber(order.shippingCharge);
  const taxAmount = safeNumber(order.taxAmount);
  const bargainDiscount = safeNumber(order.bargainDiscount);
  const giftBoxFee = order.giftBox ? safeNumber(order.giftBoxFee) : 0;
  const total = safeNumber(order.total);

  return (
    <Layout>
      <div className={styles.container}>
        {/* Back Button */}
        <button className={styles.backButton} onClick={handleBack}>
          <span className={styles.backCircle}>
            <svg
              className={styles.backArrow}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
          <span className={styles.backText}>BACK</span>
        </button>

        {/* Page Title with Status */}
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>Order Details</h1>
          <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
            {order.status?.replace(/_/g, " ").toUpperCase()}
          </span>
        </div>

        {/* Order ID and Date */}
        <div className={styles.orderMeta}>
          <span className={styles.orderId}>Order ID: {order.id}</span>
          <span className={styles.orderDate}>Placed on {formatDate(order.createdAt)}</span>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Left Panel - Products & Customer Details */}
          <div className={styles.leftPanel}>
            <div className={styles.orderCard}>
              <h3 className={styles.sectionTitle}>Products</h3>
              
              <table className={styles.productsTable}>
                <thead>
                  <tr className={styles.tableHeader}>
                    <th className={styles.colProduct}>Product</th>
                    <th className={styles.colQuantity}>Qty</th>
                    <th className={styles.colSize}>Size</th>
                    <th className={styles.colPrice}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className={styles.tableRow}>
                      <td className={styles.colProduct}>
                        <div className={styles.productCell}>
                          <img
                            src={item.productImage || PLACEHOLDER_IMAGE}
                            alt={item.productName || "Product"}
                            className={styles.productImage}
                            onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                          />
                          <span className={styles.productName}>
                            {item.productName || "Unknown Product"}
                          </span>
                        </div>
                      </td>
                      <td className={styles.colQuantity}>
                        {safeNumber(item.quantity, 1)}
                      </td>
                      <td className={styles.colSize}>
                        {item.selectedSize || "-"}
                      </td>
                      <td className={styles.colPrice}>
                        {formatRs(item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Customer Details */}
              <h3 className={styles.sectionTitle}>Shipping Details</h3>
              <div className={styles.customerDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Name:</span>
                  <span className={styles.detailValue}>{customer.fullName || "-"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Address:</span>
                  <span className={styles.detailValue}>{customer.address || "-"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>City:</span>
                  <span className={styles.detailValue}>{customer.city || "-"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Province:</span>
                  <span className={styles.detailValue}>{customer.province || "-"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Phone:</span>
                  <span className={styles.detailValue}>{customer.phone || "-"}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Email:</span>
                  <span className={styles.detailValue}>{customer.email || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Order Summary */}
          <div className={styles.rightPanel}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              <div className={styles.summaryBody}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Subtotal</span>
                  <span className={styles.summaryValue}>{formatRs(subtotal)}</span>
                </div>

                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Shipping ({order.shippingType})</span>
                  <span className={styles.summaryValue}>{formatRs(shippingCharge)}</span>
                </div>

                {order.giftBox && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Gift Box</span>
                    <span className={styles.summaryValue}>{formatRs(giftBoxFee)}</span>
                  </div>
                )}

                {taxAmount > 0 && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Tax</span>
                    <span className={styles.summaryValue}>{formatRs(taxAmount)}</span>
                  </div>
                )}

                {bargainDiscount > 0 && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Bargain Discount</span>
                    <span className={`${styles.summaryValue} ${styles.discountValue}`}>
                      -{formatRs(bargainDiscount)}
                    </span>
                  </div>
                )}

                <div className={styles.summaryDivider}></div>

                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total</span>
                  <span className={styles.totalValue}>{formatRs(total)}</span>
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  className={styles.backToOrdersButton}
                  onClick={handleGoToOrders}
                >
                  BACK TO ORDERS
                </button>
                <button
                  className={styles.dashboardButton}
                  onClick={handleGoToDashboard}
                >
                  GO TO DASHBOARD
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MyOrderDetailPage;
