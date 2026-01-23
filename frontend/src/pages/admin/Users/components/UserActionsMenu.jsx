/**
 * User Actions Menu Component
 * Dropdown menu with user management actions
 */

import React, { useState, useRef, useEffect } from "react";
import styles from "./UserActionsMenu.module.css";

const UserActionsMenu = ({ user, onBlock, onUnblock, onSuspend, onUnsuspend }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action) => {
    setIsOpen(false);
    action();
  };

  // Don't show actions for admin users
  if (user.role === "admin") {
    return (
      <span className={styles.protectedLabel}>Protected</span>
    );
  }

  return (
    <div className={styles.menuWrapper} ref={menuRef}>
      <button
        className={styles.menuButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User actions"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="4" r="2" />
          <circle cx="10" cy="10" r="2" />
          <circle cx="10" cy="16" r="2" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {/* Suspend Action */}
          {user.status !== "BLOCKED" && user.status !== "SUSPENDED" && (
            <button
              className={styles.dropdownItem}
              onClick={() => handleAction(() => onSuspend(user))}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              Suspend User
            </button>
          )}

          {/* Unsuspend Action */}
          {user.status === "SUSPENDED" && (
            <button
              className={styles.dropdownItem}
              onClick={() => handleAction(() => onUnsuspend(user.id))}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
              Remove Suspension
            </button>
          )}

          {/* Block Action */}
          {user.status !== "BLOCKED" && (
            <button
              className={`${styles.dropdownItem} ${styles.danger}`}
              onClick={() => handleAction(() => onBlock(user))}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Block User
            </button>
          )}

          {/* Unblock Action */}
          {user.status === "BLOCKED" && (
            <button
              className={`${styles.dropdownItem} ${styles.success}`}
              onClick={() => handleAction(() => onUnblock(user.id))}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
              Unblock User
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserActionsMenu;
