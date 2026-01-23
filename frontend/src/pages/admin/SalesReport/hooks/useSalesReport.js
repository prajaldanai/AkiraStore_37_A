/**
 * useSalesReport Hook
 * Manages sales report data fetching and state
 */

import { useState, useEffect, useCallback } from "react";
import { getSalesReport, getCategories } from "../../../../services/salesReportService";

// Default date range: last 30 days
function getDefaultDateRange() {
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);
  
  return {
    fromDate: fromDate.toISOString().split("T")[0],
    toDate: toDate.toISOString().split("T")[0],
  };
}

export function useSalesReport() {
  // Filter state
  const [filters, setFilters] = useState(() => ({
    ...getDefaultDateRange(),
    categoryId: "",
  }));
  
  // Categories for filter dropdown
  const [categories, setCategories] = useState([]);
  
  // Report data
  const [reportData, setReportData] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        if (response.success) {
          setCategories(response.categories || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Fetch report data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getSalesReport({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        categoryId: filters.categoryId || undefined,
      });
      
      if (response.success) {
        setReportData(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch report");
      }
    } catch (err) {
      console.error("Sales report error:", err);
      setError(err.message || "Failed to load sales report");
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  // Fetch on mount and when filters change
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);
  
  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);
  
  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilters({
      ...getDefaultDateRange(),
      categoryId: "",
    });
  }, []);
  
  // Quick date range presets
  const setDatePreset = useCallback((preset) => {
    const toDate = new Date();
    const fromDate = new Date();
    
    switch (preset) {
      case "7days":
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case "30days":
        fromDate.setDate(fromDate.getDate() - 30);
        break;
      case "90days":
        fromDate.setDate(fromDate.getDate() - 90);
        break;
      case "thisMonth":
        fromDate.setDate(1);
        break;
      case "lastMonth":
        fromDate.setMonth(fromDate.getMonth() - 1);
        fromDate.setDate(1);
        toDate.setDate(0); // Last day of previous month
        break;
      case "thisYear":
        fromDate.setMonth(0);
        fromDate.setDate(1);
        break;
      default:
        fromDate.setDate(fromDate.getDate() - 30);
    }
    
    setFilters((prev) => ({
      ...prev,
      fromDate: fromDate.toISOString().split("T")[0],
      toDate: toDate.toISOString().split("T")[0],
    }));
  }, []);
  
  return {
    // Data
    reportData,
    categories,
    
    // Filters
    filters,
    updateFilters,
    resetFilters,
    setDatePreset,
    
    // Loading state
    loading,
    error,
    
    // Actions
    refresh: fetchReport,
  };
}

export default useSalesReport;
