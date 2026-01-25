/**
 * Suspend User Modal Component
 * Modal to suspend a user for N days
 */

import React, { useState } from "react";
import styles from "./SuspendUserModal.module.css";

const SuspendUserModal = ({ user, onConfirm, onCancel, loading }) => {
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (days < 1 || days > 365) {
      setError("Suspension days must be between 1 and 365");
      return;
    }

    onConfirm(user.id, days, reason || null);
  };

  // Quick select options
  const quickOptions = [
    { label: "1 day", value: 1 },
    { label: "3 days", value: 3 },
    { label: "7 days", value: 7 },
    { label: "14 days", value: 14 },
    { label: "30 days", value: 30 },
    { label: "90 days", value: 90 },
  ];

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <h2 className={styles.title}>Suspend User</h2>
          <p className={styles.subtitle}>
            Suspend <strong>{user?.username}</strong> from making purchases
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Suspension Duration</label>
            <div className={styles.quickSelect}>
              {quickOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.quickOption} ${days === option.value ? styles.selected : ""}`}
                  onClick={() => setDays(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className={styles.customDays}>
              <input
                type="number"
                min="1"
                max="365"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                className={styles.input}
              />
              <span className={styles.inputSuffix}>days</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for suspension..."
              className={styles.textarea}
              rows={3}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.info}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              Suspended users can still login and browse, but cannot make purchases.
            </span>
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
              {loading ? "Suspending..." : "Suspend User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuspendUserModal;
