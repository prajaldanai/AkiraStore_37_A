/**
 * InventoryPage - Admin Inventory Management
 * Shows all products with filters and stock controls
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CategoryFilter from "./components/CategoryFilter";
import InventoryTable from "./components/InventoryTable";
import { getInventory, getCategories, adjustStock } from "../../../services/inventoryService";
import styles from "./InventoryPage.module.css";

const InventoryPage = () => {
  const navigate = useNavigate();

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);

  // Data state
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  // Loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        if (data.success) {
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch inventory when filters change
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getInventory({
        category: selectedCategory,
        stockStatus: stockStatus,
        search: debouncedSearch,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (data.success) {
        setProducts(data.products || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
      setError(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, stockStatus, debouncedSearch, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Handle stock adjustment
  const handleAdjustStock = async (productId, delta) => {
    try {
      const result = await adjustStock(productId, delta);

      if (result.success) {
        // Optimistically update the product in local state
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  stock: result.newStock,
                  stockStatus: result.stockStatus,
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Failed to adjust stock:", err);
      alert(err.message || "Failed to adjust stock");
      // Refresh to get correct state
      fetchInventory();
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/admin-dashboard");
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>
          <span className={styles.backArrow}>←</span>
          <span>Back to Dashboard</span>
        </button>
        <h1 className={styles.pageTitle}>Inventory Management</h1>
        <div className={styles.headerSpacer}></div>
      </header>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Left: Filters */}
        <aside className={styles.filterSidebar}>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            stockStatus={stockStatus}
            onStockStatusChange={setStockStatus}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            loading={loading}
          />
        </aside>

        {/* Right: Inventory Table */}
        <main className={styles.inventoryMain}>
          {/* Stats Bar */}
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Products</span>
              <span className={styles.statValue}>{pagination.total}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Showing</span>
              <span className={styles.statValue}>{products.length}</span>
            </div>
            {loading && <span className={styles.loadingText}>Updating...</span>}
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <span>⚠️ {error}</span>
              <button onClick={fetchInventory}>Retry</button>
            </div>
          )}

          {/* Inventory Table */}
          <InventoryTable
            products={products}
            onAdjustStock={handleAdjustStock}
            loading={loading}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
              >
                ← Previous
              </button>
              <span className={styles.pageInfo}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className={styles.pageBtn}
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
              >
                Next →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default InventoryPage;
