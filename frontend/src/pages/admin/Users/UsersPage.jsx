/**
 * Admin Users Page
 * User management dashboard
 */

import React, { useState } from "react";
import { AdminLayout } from "../../../components/admin/layout";
import { useAdminUsers } from "./hooks/useAdminUsers";
import UsersStats from "./components/UsersStats";
import UsersTable from "./components/UsersTable";
import SuspendUserModal from "./components/SuspendUserModal";
import ConfirmBlockModal from "./components/ConfirmBlockModal";
import styles from "./UsersPage.module.css";

const UsersPage = () => {
  const {
    users,
    stats,
    pagination,
    loading,
    error,
    filters,
    updateFilters,
    changePage,
    handleBlockUser,
    handleUnblockUser,
    handleSuspendUser,
    handleUnsuspendUser,
    refresh,
  } = useAdminUsers();

  // Modal states
  const [suspendModal, setSuspendModal] = useState({ open: false, user: null });
  const [blockModal, setBlockModal] = useState({ open: false, user: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Show toast
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle suspend
  const openSuspendModal = (user) => {
    setSuspendModal({ open: true, user });
  };

  const confirmSuspend = async (userId, days, reason) => {
    setActionLoading(true);
    const result = await handleSuspendUser(userId, days, reason);
    setActionLoading(false);
    setSuspendModal({ open: false, user: null });
    
    if (result.success) {
      showToast(`User suspended for ${days} days`, "success");
    } else {
      showToast(result.error || "Failed to suspend user", "error");
    }
  };

  // Handle unsuspend
  const confirmUnsuspend = async (userId) => {
    setActionLoading(true);
    const result = await handleUnsuspendUser(userId);
    setActionLoading(false);
    
    if (result.success) {
      showToast("Suspension removed", "success");
    } else {
      showToast(result.error || "Failed to remove suspension", "error");
    }
  };

  // Handle block
  const openBlockModal = (user) => {
    setBlockModal({ open: true, user });
  };

  const confirmBlock = async (userId, reason) => {
    setActionLoading(true);
    const result = await handleBlockUser(userId, reason);
    setActionLoading(false);
    setBlockModal({ open: false, user: null });
    
    if (result.success) {
      showToast("User has been blocked", "success");
    } else {
      showToast(result.error || "Failed to block user", "error");
    }
  };

  // Handle unblock
  const confirmUnblock = async (userId) => {
    setActionLoading(true);
    const result = await handleUnblockUser(userId);
    setActionLoading(false);
    
    if (result.success) {
      showToast("User has been unblocked", "success");
    } else {
      showToast(result.error || "Failed to unblock user", "error");
    }
  };

  // Handle search
  const handleSearch = (e) => {
    updateFilters({ search: e.target.value });
  };

  // Handle status filter
  const handleStatusChange = (e) => {
    updateFilters({ status: e.target.value });
  };

  return (
    <AdminLayout pageTitle="User Management">
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>User Management</h1>
            <p className={styles.subtitle}>Manage user accounts, suspensions, and access</p>
          </div>
          <button className={styles.refreshBtn} onClick={refresh} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23,4 23,10 17,10" />
              <polyline points="1,20 1,14 7,14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats */}
        <UsersStats stats={stats} loading={loading} />

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by username..."
              value={filters.search}
              onChange={handleSearch}
              className={styles.searchInput}
            />
          </div>

          <select
            value={filters.status}
            onChange={handleStatusChange}
            className={styles.select}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className={styles.errorBanner}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
            <button onClick={refresh}>Retry</button>
          </div>
        )}

        {/* Table */}
        <UsersTable
          users={users}
          loading={loading}
          onBlock={openBlockModal}
          onUnblock={confirmUnblock}
          onSuspend={openSuspendModal}
          onUnsuspend={confirmUnsuspend}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => changePage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className={styles.pageBtn}
              onClick={() => changePage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        )}

        {/* Suspend Modal */}
        {suspendModal.open && (
          <SuspendUserModal
            user={suspendModal.user}
            onConfirm={confirmSuspend}
            onCancel={() => setSuspendModal({ open: false, user: null })}
            loading={actionLoading}
          />
        )}

        {/* Block Modal */}
        {blockModal.open && (
          <ConfirmBlockModal
            user={blockModal.user}
            onConfirm={confirmBlock}
            onCancel={() => setBlockModal({ open: false, user: null })}
            loading={actionLoading}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className={`${styles.toast} ${styles[toast.type]}`}>
            {toast.type === "success" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {toast.message}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UsersPage;
