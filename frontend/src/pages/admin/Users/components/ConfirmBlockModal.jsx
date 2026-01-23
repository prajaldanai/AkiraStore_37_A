/**
 * Confirm Block Modal Component
 * Confirmation modal for blocking a user
 */

import React, { useState } from "react";
import styles from "./ConfirmBlockModal.module.css";

const ConfirmBlockModal = ({ user, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(user.id, reason || null);
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className={styles.title}>Block User</h2>
          <p className={styles.subtitle}>
            Are you sure you want to block <strong>{user?.username}</strong>?
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.warning}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <strong>This action is serious</strong>
              <p>Blocked users cannot login at all until you manually unblock them.</p>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for blocking..."
              className={styles.textarea}
              rows={3}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.confirmBtn}
              disabled={loading}
            >
              {loading ? "Blocking..." : "Block User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmBlockModal;
