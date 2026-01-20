import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderById, confirmOrder } from "../../services/buyNowService";
import Layout from "../../components/Layout/Layout";
import styles from "./ProductConfirmationPage.module.css";

// Fallback placeholder image
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect fill='%23f0f0f0' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";

/**
 * Helper to safely parse numbers and avoid NaN
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

const ProductConfirmationPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(orderId);
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError("Order not found");
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError(err.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleBack = () => {
    if (order?.sessionId) {
      navigate(`/buy-now/${order.sessionId}`);
    } else {
      navigate(-1);
    }
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      await confirmOrder(orderId);
      navigate(`/order-success/${orderId}`);
    } catch (err) {
      console.error("Failed to confirm order:", err);
      setError(err.message || "Failed to confirm order");
    } finally {
      setConfirming(false);
    }
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
            <button onClick={() => navigate("/dashboard")} className={styles.homeBtn}>
              Go to Home
            </button>
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
            <button onClick={() => navigate("/dashboard")} className={styles.homeBtn}>
              Go to Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Extract data safely
  const items = order.items || [];
  const customer = order.customer || {};
  const subtotal = safeNumber(order.subtotal);
  const shippingCharge = safeNumber(order.shippingCharge);
  const taxAmount = safeNumber(order.taxAmount);
  const bargainDiscount = safeNumber(order.bargainDiscount);
  const giftBoxFee = order.giftBox ? 20 : 0;
  const total = safeNumber(order.total);
  const giftBoxApplied = order.giftBox === true;
  const bargainApplied = bargainDiscount > 0;
  const shippingType = order.shippingType || "Standard";

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

        {/* Page Title */}
        <h1 className={styles.pageTitle}>Product Confirmation</h1>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Left Panel - Products & Customer Details */}
          <div className={styles.leftPanel}>
            <div className={styles.orderCard}>
              {/* Products Table */}
              <table className={styles.productsTable}>
                <thead>
                  <tr className={styles.tableHeader}>
                    <th className={styles.colProduct}>Product</th>
                    <th className={styles.colQuantity}>Quantity</th>
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

              {/* Customer Details Section */}
              {/* Customer Details Section */}
              <div className={styles.customerDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Name:</span>
                  <span className={styles.detailValue}>
                    {customer.fullName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "-"}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Address:</span>
                  <span className={styles.detailValue}>
                    {customer.address || "-"}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Contact no:</span>
                  <span className={styles.detailValue}>
                    {customer.phone || "-"}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>City:</span>
                  <span className={styles.detailValue}>
                    {customer.city || "-"}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Province:</span>
                  <span className={styles.detailValue}>
                    {customer.province || "-"}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Shipping Details:</span>
                  <span className={styles.detailValue}>
                    {shippingType} - {formatRs(shippingCharge)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Order Summary */}
          <div className={styles.rightPanel}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              <div className={styles.summaryBody}>
                {/* Price */}
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Price</span>
                  <span className={styles.summaryValue}>{formatRs(subtotal)}</span>
                </div>

                {/* Shipping */}
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Shipping</span>
                  <span className={styles.summaryValue}>{formatRs(shippingCharge)}</span>
                </div>

                {/* Tax */}
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Tax</span>
                  <span className={styles.summaryValue}>{formatRs(taxAmount)}</span>
                </div>

                {/* Bargain Amount */}
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Bargain Amount</span>
                  <span className={`${styles.summaryValue} ${bargainDiscount > 0 ? styles.discountValue : ""}`}>
                    {bargainDiscount > 0 ? `-${formatRs(bargainDiscount)}` : formatRs(0)}
                  </span>
                </div>

                {/* Disabled Checkboxes */}
                <div className={styles.checkboxSection}>
                  <div className={styles.checkboxRow}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={giftBoxApplied}
                        disabled
                        className={styles.checkbox}
                      />
                      <span>Pack in Gift box</span>
                      <span className={styles.checkboxPrice}>Rs.20</span>
                    </label>
                  </div>

                  <div className={styles.checkboxRow}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={bargainApplied}
                        disabled
                        className={styles.checkbox}
                      />
                      <span>Bargain Your Price</span>
                    </label>
                  </div>

                  <p className={styles.hintText}>To change these options, click BACK.</p>
                </div>

                {/* Divider */}
                <div className={styles.summaryDivider}></div>

                {/* Total */}
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total Price</span>
                  <span className={styles.totalValue}>{formatRs(total)}</span>
                </div>
              </div>

              {/* NEXT Button */}
              <button
                className={styles.nextButton}
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming ? "Processing..." : "NEXT"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductConfirmationPage;
