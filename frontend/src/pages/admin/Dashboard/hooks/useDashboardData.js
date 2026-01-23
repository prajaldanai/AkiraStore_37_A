/**
 * useDashboardData Hook
 * Manages dashboard data fetching and state
 */

import { useState, useEffect, useCallback } from "react";
import { getDashboard, getSalesOverview } from "../../../../services/dashboardService";

export function useDashboardData() {
  const [data, setData] = useState(null);
  const [salesDays, setSalesDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch full dashboard data
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getDashboard(salesDays);
      if (response.success) {
        setData(response.data);
      } else {
        throw new Error(response.message || "Failed to load dashboard");
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [salesDays]);

  // Initial fetch
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Change sales period
  const changeSalesPeriod = useCallback(async (days) => {
    setSalesDays(days);
    try {
      const response = await getSalesOverview(days);
      if (response.success) {
        setData((prev) => ({
          ...prev,
          salesOverview: response.data,
        }));
      }
    } catch (err) {
      console.error("Failed to update sales period:", err);
    }
  }, []);

  // Refresh dashboard
  const refresh = useCallback(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    salesDays,
    loading,
    error,
    changeSalesPeriod,
    refresh,
  };
}
