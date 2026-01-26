import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAdminOrders, updateOrderStatus } from "../../services/adminOrderService";
import AdminOrderDetailsModal from "../../components/AdminOrderDetailsModal/AdminOrderDetailsModal";
import styles from "./AdminOrdersPage.module.css";

// Global admin font lock - ensures consistent font sizing across all devices
import "../../styles/adminGlobal.css";

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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [toast, setToast] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  const orderRowRefs = useRef({});

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

  // Handle highlight parameter from notification
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (highlightId && orders.length > 0) {
      const orderId = parseInt(highlightId, 10) || highlightId;
      setHighlightedOrderId(orderId);
      
      // Scroll to the highlighted order
      setTimeout(() => {
        const orderRow = orderRowRefs.current[orderId];
        if (orderRow) {
          orderRow.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        // Also open the order details modal
        setSelectedOrderId(orderId);
      }, 300);

      // Clear the highlight after 5 seconds
      setTimeout(() => {
        setHighlightedOrderId(null);
        // Remove highlight param from URL
        setSearchParams({});
      }, 5000);
    }
  }, [searchParams, orders, setSearchParams]);

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
    <div className={styles.container} data-admin="true">
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
        
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            Active Orders
          </h1>
          <p className={styles.pageSubtitle}>Manage and track all customer orders</p>
        </div>
        
        <div className={styles.headerStats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{pagination.total}</span>
            <span className={styles.statLabel}>Total Orders</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by Order ID, Email, Phone, or Name..."
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
          />
          {search && (
            <button 
              className={styles.clearSearchBtn}
              onClick={() => { setSearch(""); fetchOrders(1); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status:</label>
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
        </div>

        <button 
          className={styles.refreshBtn}
          onClick={() => fetchOrders(pagination.page)}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? styles.spinning : ""}>
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
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
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <span>Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No Active Orders</h3>
            <p className={styles.emptyMessage}>
              {search || statusFilter 
                ? "No orders match your search criteria" 
                : "There are no active orders at the moment"}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
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
                    <tr 
                      key={order.id}
                      ref={(el) => orderRowRefs.current[order.id] = el}
                      className={highlightedOrderId === order.id ? styles.highlightedRow : ""}
                    >
                      <td>
                        <span className={styles.orderId}>{shortenId(order.id)}</span>
                      </td>
                      <td className={styles.dateCell}>{formatDate(order.createdAt)}</td>
                      <td>
                        <div className={styles.customerCell}>
                          <span className={styles.customerName}>{order.customer?.fullName}</span>
                          <span className={styles.customerEmail}>{order.customer?.email}</span>
                          <span className={styles.customerPhone}>{order.customer?.phone}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.itemsCount}>{order.itemsCount || order.items?.length || 1}</span>
                      </td>
                      <td>
                        <span className={styles.shippingLabel}>{order.shippingMethodLabel}</span>
                      </td>
                      <td>
                        <span className={styles.totalAmount}>{formatRs(order.total)}</span>
                      </td>
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
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
                              <option value="">Update →</option>
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
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <span className={styles.pageInfo}>
                  Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> 
                  <span className={styles.totalCount}>({pagination.total} orders)</span>
                </span>
                <div className={styles.pageButtons}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                    Previous
                  </button>
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
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
