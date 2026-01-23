/**
 * useProductSearch Hook
 * Manages product search state and logic
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { searchProducts } from "../services/searchService";

export default function useProductSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debounceTimer = useRef(null);
  const abortController = useRef(null);

  // Debounced search
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      setTotalResults(0);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const data = await searchProducts(searchQuery.trim(), "quick");
      
      if (data.success !== false) {
        setResults(data.results || []);
        setTotalResults(data.totalResults || 0);
      } else {
        setResults([]);
        setTotalResults(0);
        if (data.message && data.message !== "Search query must be at least 2 characters") {
          setError(data.message);
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Search failed. Please try again.");
        setResults([]);
        setTotalResults(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle query change with debounce
  const handleQueryChange = useCallback((newQuery) => {
    setQuery(newQuery);
    setSelectedIndex(-1);

    // Clear previous debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Open dropdown if there's content
    if (newQuery.trim().length >= 2) {
      setIsOpen(true);
      setIsLoading(true);
      
      // Debounce the search
      debounceTimer.current = setTimeout(() => {
        performSearch(newQuery);
      }, 300);
    } else {
      setResults([]);
      setTotalResults(0);
      setIsLoading(false);
      if (newQuery.trim().length === 0) {
        setIsOpen(false);
      }
    }
  }, [performSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setTotalResults(0);
    setIsOpen(false);
    setError(null);
    setSelectedIndex(-1);
  }, []);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSelectedIndex(-1);
  }, []);

  // Open dropdown
  const openDropdown = useCallback(() => {
    if (query.trim().length >= 2) {
      setIsOpen(true);
    }
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Escape":
        e.preventDefault();
        closeDropdown();
        break;
      default:
        break;
    }
  }, [isOpen, results.length, closeDropdown]);

  // Get selected result
  const getSelectedResult = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < results.length) {
      return results[selectedIndex];
    }
    return null;
  }, [selectedIndex, results]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    // State
    query,
    results,
    totalResults,
    isLoading,
    isOpen,
    error,
    selectedIndex,

    // Actions
    setQuery: handleQueryChange,
    clearSearch,
    closeDropdown,
    openDropdown,
    handleKeyDown,
    getSelectedResult,
    setSelectedIndex,
  };
}
