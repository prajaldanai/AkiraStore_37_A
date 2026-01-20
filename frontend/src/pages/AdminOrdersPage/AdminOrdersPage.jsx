import React, { useState, useEffect, useCallback } from "react";
import { getAdminOrders, updateOrderStatus } from "../../services/adminOrderService";
import AdminOrderDetailsModal from "../../components/AdminOrderDetailsModal/AdminOrderDetailsModal";
import styles from "./AdminOrdersPage.module.css";

/**
 * Format date for display
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
 * Format currency
 */
const formatRs = (amount) => {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString("en-IN")}`;
};

/**
 * Shorten order ID
 */
const shortenId = (id) => {
  if (!id) return "-";
  if (id.length <= 8) return id;
  return `...${id.slice(-8)}`;
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
 * Valid status transitions for dropdown options
 */
const getNextStatuses = (currentStatus) => {
  const transitions = {
    PLACED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED", "CANCELLED"],
    DELIVERED: [],
    CANCELLED: [],
  };
  return transitions[currentStatus?.toUpperCase()] || [];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [toast, setToast] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  /**
   * Fetch orders from API
   */
  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAdminOrders({
        scope: "active",
        search: search.trim(),
        status: statusFilter,
        page,
        limit: 15,
      });
      
      if (data.success) {
        setOrders(data.orders || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      } else {
        setError("Failed to load orders");
      }
    } catch (err) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  /**
   * Handle status change
   */
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      
      const data = await updateOrderStatus(orderId, newStatus);
      
      if (data.success) {
        showToast(`Order status updated to ${newStatus}`, "success");
        
        // If status is now DELIVERED or CANCELLED, remove from active list
        if (newStatus === "DELIVERED" || newStatus === "CANCELLED") {
          setOrders(prev => prev.filter(o => o.id !== orderId));
        } else {
          // Update the order in place
          setOrders(prev => prev.map(o => 
            o.id === orderId ? data.order : o
          ));
        }
      } else {
        showToast(data.message || "Failed to update status", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  /**
   * Show toast notification
   */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /**
   * Handle search with debounce
   */
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  /**
   * Handle search submit
   */
  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
      fetchOrders(1);
    }
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOrders(newPage);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Orders</h1>

      {/* Top Bar */}
      <div className={styles.topBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by Order ID, Email, Phone, or Name..."
          value={search}
          onChange={handleSearchChange}
          onKeyDown={handleSearchSubmit}
        />
        
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={handleFilterChange}
        >
          <option value="">All Active</option>
          <option value="PLACED">Placed</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
        </select>

        <button 
          className={styles.refreshBtn}
          onClick={() => fetchOrders(pagination.page)}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          {error}
          <button className={styles.retryBtn} onClick={() => fetchOrders(1)}>
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <h3 className={styles.emptyTitle}>No Active Orders</h3>
            <p className={styles.emptyMessage}>
              {search || statusFilter 
                ? "No orders match your search criteria" 
                : "There are no active orders at the moment"}
            </p>
          </div>
        ) : (
          <>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Shipping</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className={styles.orderId}>{shortenId(order.id)}</span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <div className={styles.customerCell}>
                        <span className={styles.customerName}>{order.customer?.fullName}</span>
                        <span className={styles.customerEmail}>{order.customer?.email}</span>
                        <span className={styles.customerPhone}>{order.customer?.phone}</span>
                      </div>
                    </td>
                    <td>{order.itemsCount || order.items?.length || 1}</td>
                    <td>{order.shippingMethodLabel}</td>
                    <td>{formatRs(order.total)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          className={styles.viewBtn}
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          View
                        </button>
                        
                        {getNextStatuses(order.status).length > 0 && (
                          <select
                            className={styles.statusSelect}
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleStatusChange(order.id, e.target.value);
                              }
                            }}
                            disabled={updatingOrderId === order.id}
                          >
                            <option value="">Update Status</option>
                            {getNextStatuses(order.status).map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <span className={styles.pageInfo}>
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
                </span>
                <div className={styles.pageButtons}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    Previous
                  </button>
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrderId && (
        <AdminOrderDetailsModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
