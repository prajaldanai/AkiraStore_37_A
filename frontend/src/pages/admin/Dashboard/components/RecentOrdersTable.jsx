/**
 * Recent Orders Table Component
 * Latest orders with status and quick actions
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./RecentOrdersTable.module.css";

const STATUS_CONFIG = {
  delivered: { label: "Delivered", className: "delivered" },
  processing: { label: "Processing", className: "processing" },
  pending: { label: "Pending", className: "pending" },
  cancelled: { label: "Cancelled", className: "cancelled" },
  shipped: { label: "Shipped", className: "shipped" },
};

const RecentOrdersTable = ({ orders, loading }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status?.toLowerCase()] || { label: status, className: "default" };
  };

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonTable}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Recent Orders</h3>
        <button
          className={styles.viewAllBtn}
          onClick={() => navigate("/admin/orders")}
        >
          View All →
        </button>
      </div>

      <div className={styles.tableWrapper}>
        {!orders || orders.length === 0 ? (
          <div className={styles.empty}>No recent orders</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <tr key={order.id}>
                    <td className={styles.orderId}>#{order.id}</td>
                    <td className={styles.customer}>
                      <span className={styles.customerName}>
                        {order.customerName || order.shippingAddress?.name || "Guest"}
                      </span>
                      <span className={styles.customerEmail}>
                        {order.customerEmail || order.shippingAddress?.email || ""}
                      </span>
                    </td>
                    <td className={styles.date}>{formatDate(order.createdAt)}</td>
                    <td className={styles.amount}>
                      Rs. {parseFloat(order.totalAmount || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className={`${styles.status} ${styles[statusConfig.className]}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RecentOrdersTable;
