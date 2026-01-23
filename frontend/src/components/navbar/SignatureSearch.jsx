/**
 * SignatureSearch Component
 * Premium navbar search with live suggestions and image upload
 */

import { useRef, useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchDropdown from "./SearchDropdown";
import useProductSearch from "../../hooks/useProductSearch";
import { searchByImage } from "../../services/searchService";
import styles from "./SignatureSearch.module.css";

export default function SignatureSearch() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const {
    query,
    results,
    totalResults,
    isLoading,
    isOpen,
    selectedIndex,
    setQuery,
    clearSearch,
    closeDropdown,
    openDropdown,
    handleKeyDown,
    getSelectedResult,
    setSelectedIndex,
  } = useProductSearch();

  // Show toast notification
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Handle image upload button click
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle image file selection
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
    if (!validTypes.includes(file.type)) {
      showToast("Please upload a valid image (JPG, PNG, WebP, AVIF, GIF)", "error");
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      showToast("Image size should be less than 20MB", "error");
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setUploadedImage({ file, previewUrl });
    setShowImagePreview(true);

    // Clear file input for re-selection
    e.target.value = "";
  };

  // Handle image search
  const handleImageSearch = async () => {
    if (!uploadedImage?.file) return;

    setIsImageSearching(true);
    try {
      const response = await searchByImage(uploadedImage.file);
      
      if (response.success && response.results.length > 0) {
        // Store results in sessionStorage for the results page
        sessionStorage.setItem("imageSearchResults", JSON.stringify(response));
        
        const matchMsg = response.exactMatches > 0 
          ? `Found ${response.exactMatches} exact match${response.exactMatches > 1 ? "es" : ""}!`
          : `Found ${response.results.length} similar products!`;
        
        showToast(matchMsg, "success");
        
        // Clear preview first
        clearImagePreview();
        closeDropdown();
        
        // Small delay to ensure sessionStorage is written before navigation
        setTimeout(() => {
          navigate("/search?type=image");
        }, 50);
      } else {
        showToast(response.message || "No matching products found. Try a product image from our store.", "error");
      }
    } catch (error) {
      showToast("Image search failed. Please try again.", "error");
    } finally {
      setIsImageSearching(false);
    }
  };

  // Clear image preview
  const clearImagePreview = () => {
    if (uploadedImage?.previewUrl) {
      URL.revokeObjectURL(uploadedImage.previewUrl);
    }
    setUploadedImage(null);
    setShowImagePreview(false);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeDropdown]);

  // Navigate to product
  const navigateToProduct = useCallback((product) => {
    clearSearch();
    navigate(`/product/${product.id}`);
  }, [navigate, clearSearch]);

  // Navigate to search results page
  const navigateToResults = useCallback(() => {
    if (query.trim().length >= 2) {
      closeDropdown();
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [query, navigate, closeDropdown]);

  // Handle result click
  const handleResultClick = useCallback((product) => {
    navigateToProduct(product);
  }, [navigateToProduct]);

  // Handle + button click
  const handleActionClick = useCallback(() => {
    const selected = getSelectedResult();
    
    if (selected) {
      // If a result is selected, navigate to it
      navigateToProduct(selected);
    } else if (query.trim().length >= 2) {
      // Otherwise, go to search results page
      navigateToResults();
    }
  }, [getSelectedResult, query, navigateToProduct, navigateToResults]);

  // Handle Enter key
  const handleEnterKey = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const selected = getSelectedResult();
      
      if (selected) {
        navigateToProduct(selected);
      } else if (query.trim().length >= 2) {
        navigateToResults();
      }
    }
  }, [getSelectedResult, query, navigateToProduct, navigateToResults]);

  // Combined key handler
  const handleCombinedKeyDown = useCallback((e) => {
    handleKeyDown(e);
    handleEnterKey(e);
  }, [handleKeyDown, handleEnterKey]);

  // Handle input change
  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  // Handle clear button
  const handleClear = () => {
    clearSearch();
    inputRef.current?.focus();
  };

  const hasQuery = query.trim().length > 0;
  const canSearch = query.trim().length >= 2;

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Search Input */}
      <div className={`${styles.inputWrapper} ${isOpen ? styles.focused : ""}`}>
        {/* Search Icon */}
        <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="Search products... (Try: shoes, jacket, phone)"
          value={query}
          onChange={handleInputChange}
          onFocus={openDropdown}
          onKeyDown={handleCombinedKeyDown}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Clear Button */}
        {hasQuery && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Image Upload Button */}
        <button
          type="button"
          className={styles.imageUploadBtn}
          onClick={handleImageUploadClick}
          title="Search by image"
          aria-label="Upload image to search"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          onChange={handleImageSelect}
          style={{ display: "none" }}
          aria-hidden="true"
        />

        {/* Divider */}
        <div className={styles.divider} />

        {/* Action Button */}
        <button
          type="button"
          className={`${styles.actionBtn} ${canSearch ? styles.active : ""}`}
          onClick={handleActionClick}
          disabled={!canSearch}
          title={canSearch ? "Search / Quick Find" : "Type at least 2 characters"}
        >
          {isLoading ? (
            <div className={styles.spinner} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Dropdown */}
      <SearchDropdown
        isOpen={isOpen}
        isLoading={isLoading}
        query={query}
        results={results}
        totalResults={totalResults}
        selectedIndex={selectedIndex}
        onResultClick={handleResultClick}
        onResultHover={setSelectedIndex}
        onClose={closeDropdown}
        onViewAll={navigateToResults}
      />

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.type === "success" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && uploadedImage && (
        <div className={styles.imagePreviewOverlay} onClick={clearImagePreview}>
          <div className={styles.imagePreviewModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.imagePreviewHeader}>
              <h3>Search by Image</h3>
              <button
                type="button"
                className={styles.closePreviewBtn}
                onClick={clearImagePreview}
                aria-label="Close preview"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.imagePreviewContent}>
              <img
                src={uploadedImage.previewUrl}
                alt="Upload preview"
                className={styles.previewImage}
              />
            </div>

            <div className={styles.imagePreviewActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={clearImagePreview}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.searchImageBtn}
                onClick={handleImageSearch}
                disabled={isImageSearching}
              >
                {isImageSearching ? (
                  <>
                    <div className={styles.spinner} />
                    Searching...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    Find Similar Products
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
