/**
 * Admin Topbar Component
 * Sticky header with search, notifications, and user dropdown
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getNotifications, globalSearch } from "../../../services/dashboardService";
import styles from "./Topbar.module.css";

const Topbar = ({ pageTitle, showSearch = true, showBackButton = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ products: [], orders: [], users: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  // Check if we're on the main dashboard (no back button needed there)
  const isMainDashboard = location.pathname === "/admin-dashboard";

  // Get admin info from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = user.name || user.username || "Admin";
  const adminInitial = adminName.charAt(0).toUpperCase();

  // Fetch notifications on mount and every 30 seconds
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await getNotifications();
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults({ products: [], orders: [], users: [] });
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await globalSearch(searchQuery);
        if (response.success) {
          setSearchResults(response.data);
          setShowSearchResults(true);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const handleResultClick = (item) => {
    setShowSearchResults(false);
    setSearchQuery("");
    
    if (item.type === "product") {
      navigate(`/admin/category/${item.categorySlug || "men"}`);
    } else if (item.type === "order") {
      navigate(`/admin/orders`);
    } else if (item.type === "user") {
      navigate(`/admin/users`);
    }
  };

  const handleNotificationClick = (notification) => {
    setShowNotifications(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const formatTime = (time) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "new_order":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 5L8 2L3 5V11L8 14L13 11V5Z" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        );
      case "low_stock":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 5V8M8 11H8.01M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      case "cancelled":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 6L6 10M6 6L10 10M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const totalResults = searchResults.products.length + searchResults.orders.length + searchResults.users.length;

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {/* Back Button */}
        {showBackButton && !isMainDashboard && (
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <h1 className={styles.pageTitle}>{pageTitle}</h1>
      </div>

      <div className={styles.right}>
        {/* Search */}
        {showSearch && (
          <div className={styles.searchWrapper} ref={searchRef}>
            <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
              <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search products, orders, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchLoading && <span className={styles.searchSpinner} />}
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && totalResults > 0 && (
              <div className={styles.searchResults}>
                {searchResults.products.length > 0 && (
                  <div className={styles.searchSection}>
                    <div className={styles.searchSectionTitle}>Products</div>
                    {searchResults.products.map((item) => (
                      <button
                        key={`product-${item.id}`}
                        className={styles.searchResultItem}
                        onClick={() => handleResultClick(item)}
                      >
                        <div className={styles.searchResultIcon}>
                          {item.image ? (
                            <img src={item.image} alt={item.name} />
                          ) : (
                            <span>📦</span>
                          )}
                        </div>
                        <div className={styles.searchResultInfo}>
                          <div className={styles.searchResultName}>{item.name}</div>
                          <div className={styles.searchResultMeta}>₹{item.price} · {item.stock} in stock</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.orders.length > 0 && (
                  <div className={styles.searchSection}>
                    <div className={styles.searchSectionTitle}>Orders</div>
                    {searchResults.orders.map((item) => (
                      <button
                        key={`order-${item.id}`}
                        className={styles.searchResultItem}
                        onClick={() => handleResultClick(item)}
                      >
                        <div className={styles.searchResultIcon}>
                          <span>📋</span>
                        </div>
                        <div className={styles.searchResultInfo}>
                          <div className={styles.searchResultName}>Order #{item.id}</div>
                          <div className={styles.searchResultMeta}>{item.customerName} · ₹{item.total}</div>
                        </div>
                        <span className={`${styles.statusBadge} ${styles[item.status?.toLowerCase()]}`}>
                          {item.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.users.length > 0 && (
                  <div className={styles.searchSection}>
                    <div className={styles.searchSectionTitle}>Users</div>
                    {searchResults.users.map((item) => (
                      <button
                        key={`user-${item.id}`}
                        className={styles.searchResultItem}
                        onClick={() => handleResultClick(item)}
                      >
                        <div className={styles.searchResultIcon}>
                          <span>👤</span>
                        </div>
                        <div className={styles.searchResultInfo}>
                          <div className={styles.searchResultName}>{item.name}</div>
                          <div className={styles.searchResultMeta}>{item.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showSearchResults && searchQuery.length >= 2 && totalResults === 0 && !searchLoading && (
              <div className={styles.searchResults}>
                <div className={styles.noResults}>No results found for "{searchQuery}"</div>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <div className={styles.notificationWrapper} ref={notificationRef}>
          <button 
            className={styles.iconBtn} 
            title="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C7.23858 2 5 4.23858 5 7V10.5858L4.29289 11.2929C4.00689 11.5789 4.06234 12.009 4.20608 12.3825C4.34982 12.7561 4.69053 13 5 13H15C15.3095 13 15.6502 12.7561 15.7939 12.3825C15.9377 12.009 15.9931 11.5789 15.7071 11.2929L15 10.5858V7C15 4.23858 12.7614 2 10 2Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 14C8 15.1046 8.89543 16 10 16C11.1046 16 12 15.1046 12 14" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notificationHeader}>
                <h4>Notifications</h4>
                <span className={styles.notificationCount}>{notifications.length}</span>
              </div>
              <div className={styles.notificationList}>
                {notifications.length === 0 ? (
                  <div className={styles.noNotifications}>No notifications</div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      className={`${styles.notificationItem} ${notification.isNew ? styles.unread : ""}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className={styles.notificationIcon}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className={styles.notificationContent}>
                        <div className={styles.notificationTitle}>{notification.title}</div>
                        <div className={styles.notificationMessage}>{notification.message}</div>
                        <div className={styles.notificationTime}>{formatTime(notification.time)}</div>
                      </div>
                      {notification.isNew && <span className={styles.unreadDot} />}
                    </button>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <button className={styles.viewAllBtn} onClick={() => navigate("/admin/orders")}>
                  View All Orders
                </button>
              )}
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className={styles.userDropdown} ref={dropdownRef}>
          <button
            className={styles.userBtn}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className={styles.avatar}>{adminInitial}</div>
            <span className={styles.userName}>{adminName}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={showDropdown ? styles.rotated : ""}>
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {showDropdown && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownAvatar}>{adminInitial}</div>
                <div className={styles.dropdownInfo}>
                  <div className={styles.dropdownName}>{adminName}</div>
                  <div className={styles.dropdownRole}>Administrator</div>
                </div>
              </div>
              <div className={styles.dropdownDivider} />
              <button className={styles.dropdownItem} onClick={() => navigate("/admin/settings")}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M13.6569 9.65685L13.1213 9.12132C12.7308 8.73079 12.7308 8.09763 13.1213 7.7071L13.6569 7.17157C14.0474 6.78104 14.0474 6.14788 13.6569 5.75735L13.6569 5.75735C13.2663 5.36683 12.6332 5.36683 12.2426 5.75735L11.7071 6.29289C11.3166 6.68342 10.6834 6.68342 10.2929 6.29289L10.2929 6.29289C9.90237 5.90237 9.90237 5.2692 10.2929 4.87868L10.8284 4.34314C11.219 3.95262 11.219 3.31945 10.8284 2.92893V2.92893C10.4379 2.5384 9.80474 2.5384 9.41421 2.92893L8.87868 3.46447C8.48816 3.85499 7.85499 3.85499 7.46447 3.46447L7.46447 3.46447C7.07394 3.07394 7.07394 2.44078 7.46447 2.05025L8 1.51472C8.39052 1.12419 8.39052 0.491028 8 0.100505V0.100505C7.60948 -0.290019 6.97631 -0.290019 6.58579 0.100505L6.05025 0.636039C5.65973 1.02656 5.02656 1.02656 4.63604 0.636039V0.636039C4.24551 0.245515 3.61235 0.245515 3.22183 0.636039L2.68629 1.17157C2.29576 1.5621 2.29576 2.19526 2.68629 2.58579V2.58579C3.07682 2.97631 3.07682 3.60948 2.68629 4L2.15076 4.53553C1.76024 4.92606 1.12707 4.92606 0.736548 4.53553V4.53553C0.346024 4.14501 0.346024 3.51184 0.736548 3.12132L1.27208 2.58579" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Settings
              </button>
              <button className={styles.dropdownItem} onClick={() => navigate("/")}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 8H13M13 8L10 5M13 8L10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                View Store
              </button>
              <div className={styles.dropdownDivider} />
              <button className={`${styles.dropdownItem} ${styles.logout}`} onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M11 11L14 8L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
