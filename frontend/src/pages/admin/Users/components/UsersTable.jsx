/**
 * Users Table Component
 * Displays users in a table with actions
 */

import React from "react";
import UserActionsMenu from "./UserActionsMenu";
import styles from "./UsersTable.module.css";

const UsersTable = ({
  users,
  loading,
  onBlock,
  onUnblock,
  onSuspend,
  onUnsuspend,
}) => {
  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (value) => {
    return `₹${(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { className: styles.badgeActive, label: "Active" },
      SUSPENDED: { className: styles.badgeSuspended, label: "Suspended" },
      BLOCKED: { className: styles.badgeBlocked, label: "Blocked" },
    };
    const config = statusConfig[status] || statusConfig.ACTIVE;
    return <span className={`${styles.badge} ${config.className}`}>{config.label}</span>;
  };

  // Get role badge
  const getRoleBadge = (role) => {
    if (role === "admin") {
      return <span className={`${styles.badge} ${styles.badgeAdmin}`}>Admin</span>;
    }
    return <span className={`${styles.badge} ${styles.badgeUser}`}>User</span>;
  };

  if (loading) {
    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Logins</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td>
                  <div className={styles.skeletonCell}>
                    <div className={styles.skeletonAvatar} />
                    <div className={styles.skeletonLines}>
                      <div className={styles.skeletonLine} style={{ width: "120px" }} />
                      <div className={styles.skeletonLine} style={{ width: "160px" }} />
                    </div>
                  </div>
                </td>
                <td><div className={styles.skeletonLine} style={{ width: "50px" }} /></td>
                <td><div className={styles.skeletonLine} style={{ width: "70px" }} /></td>
                <td><div className={styles.skeletonLine} style={{ width: "30px" }} /></td>
                <td><div className={styles.skeletonLine} style={{ width: "30px" }} /></td>
                <td><div className={styles.skeletonLine} style={{ width: "80px" }} /></td>
                <td><div className={styles.skeletonLine} style={{ width: "90px" }} /></td>
                <td><div className={styles.skeletonLine} style={{ width: "24px" }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <h3>No users found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Logins</th>
            <th>Orders</th>
            <th>Total Spent</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>
                    {user.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className={styles.userDetails}>
                    <span className={styles.userName}>{user.username}</span>
                    <span className={styles.userId}>ID: {user.id}</span>
                  </div>
                </div>
              </td>
              <td>{getRoleBadge(user.role)}</td>
              <td>
                <div className={styles.statusCell}>
                  {getStatusBadge(user.status)}
                  {user.status === "SUSPENDED" && user.suspended_until && (
                    <span className={styles.suspendedUntil}>
                      Until {formatDate(user.suspended_until)}
                    </span>
                  )}
                </div>
              </td>
              <td className={styles.numericCell}>{user.login_count || 0}</td>
              <td className={styles.numericCell}>{user.totalOrders || 0}</td>
              <td className={styles.numericCell}>{formatCurrency(user.totalSpent)}</td>
              <td>{formatDate(user.created_at)}</td>
              <td>
                <UserActionsMenu
                  user={user}
                  onBlock={onBlock}
                  onUnblock={onUnblock}
                  onSuspend={onSuspend}
                  onUnsuspend={onUnsuspend}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;
