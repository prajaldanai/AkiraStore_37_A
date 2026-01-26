import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminOrders } from "../../services/adminOrderService";
import AdminOrderDetailsModal from "../../components/AdminOrderDetailsModal/AdminOrderDetailsModal";
import styles from "./AdminOrderHistoryPage.module.css";

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
    DELIVERED: styles.statusDelivered,
    CANCELLED: styles.statusCancelled,
  };
  return statusMap[status?.toUpperCase()] || styles.statusDelivered;
};

/**
 * Get completed date based on status
 */
const getCompletedDate = (order) => {
  if (order.status === "DELIVERED") {
    return order.deliveredAt;
  }
  if (order.status === "CANCELLED") {
    return order.cancelledAt;
  }
  return order.updatedAt;
};

export default function AdminOrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  /**
   * Fetch orders from API
   */
  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getAdminOrders({
        scope: "history",
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
      {/* Header with Back Button */}
      <div className={styles.header}>
        <button 
          className={styles.backBtn}
          onClick={() => navigate("/admin-dashboard")}
          aria-label="Back to Dashboard"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back</span>
        </button>
        <h1 className={styles.pageTitle}>Order History</h1>
      </div>

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
          <option value="">All History</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
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
          <div className={styles.loading}>Loading order history...</div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h3 className={styles.emptyTitle}>No Order History</h3>
            <p className={styles.emptyMessage}>
              {search || statusFilter 
                ? "No orders match your search criteria" 
                : "There are no completed or cancelled orders yet"}
            </p>
          </div>
        ) : (
          <>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Order Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Completed</th>
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
                    <td>{formatRs(order.total)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <span className={styles.completedDate}>
                        {formatDate(getCompletedDate(order))}
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
    </div>
  );
}
