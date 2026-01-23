/**
 * useAdminUsers Hook
 * State management for admin users page
 */

import { useState, useEffect, useCallback } from "react";
import {
  getUsers,
  blockUser,
  unblockUser,
  suspendUser,
  unsuspendUser,
} from "../../../../services/adminUserService";

export function useAdminUsers() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLogins: 0,
    suspendedCount: 0,
    blockedCount: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getUsers({
        search: filters.search,
        status: filters.status,
        page: pagination.page,
        limit: pagination.limit,
      });

      setUsers(result.users || []);
      setStats(result.stats || {});
      setPagination((prev) => ({
        ...prev,
        totalPages: result.pagination?.totalPages || 1,
        totalCount: result.pagination?.totalCount || 0,
      }));
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  // Change page
  const changePage = useCallback((newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Block user action
  const handleBlockUser = useCallback(async (userId, reason = null) => {
    try {
      await blockUser(userId, reason);
      await fetchUsers(); // Refresh
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchUsers]);

  // Unblock user action
  const handleUnblockUser = useCallback(async (userId) => {
    try {
      await unblockUser(userId);
      await fetchUsers(); // Refresh
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchUsers]);

  // Suspend user action
  const handleSuspendUser = useCallback(async (userId, days, reason = null) => {
    try {
      await suspendUser(userId, days, reason);
      await fetchUsers(); // Refresh
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchUsers]);

  // Unsuspend user action
  const handleUnsuspendUser = useCallback(async (userId) => {
    try {
      await unsuspendUser(userId);
      await fetchUsers(); // Refresh
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchUsers]);

  // Refresh
  const refresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
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
  };
}

export default useAdminUsers;
