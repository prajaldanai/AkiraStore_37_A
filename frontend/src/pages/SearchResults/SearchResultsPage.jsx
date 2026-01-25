/**
 * SearchResultsPage
 * Full search results page
 */

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { searchProducts } from "../../services/searchService";
import styles from "./SearchResultsPage.module.css";

const API_BASE = "http://localhost:5000";

const CATEGORIES = [
  { name: "Men", slug: "men" },
  { name: "Women", slug: "women" },
  { name: "Kids", slug: "kids" },
  { name: "Shoes", slug: "shoes" },
  { name: "Electronics", slug: "electronics" },
];

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const searchType = searchParams.get("type") || "text";

  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isImageSearch, setIsImageSearch] = useState(searchType === "image");
  const imageResultsLoaded = useRef(false);

  // Handle image search results from sessionStorage
  useEffect(() => {
    if (searchType === "image") {
      setIsImageSearch(true);
      
      // Prevent double-loading in StrictMode
      if (imageResultsLoaded.current) {
        setIsLoading(false);
        return;
      }
      
      const loadImageResults = () => {
        const storedResults = sessionStorage.getItem("imageSearchResults");
        console.log("Reading imageSearchResults:", storedResults ? "Found data" : "No data");
        
        if (storedResults) {
          try {
            const data = JSON.parse(storedResults);
            console.log("Parsed results:", data.results?.length, "products");
            setResults(data.results || []);
            setTotalResults(data.totalResults || 0);
            // Mark as loaded BEFORE clearing
            imageResultsLoaded.current = true;
            // Clear after successful read
            sessionStorage.removeItem("imageSearchResults");
            setIsLoading(false);
            return true;
          } catch (e) {
            console.error("Failed to parse imageSearchResults:", e);
          }
        }
        return false;
      };
      
      // Try immediately
      if (!loadImageResults()) {
        // If not found, wait a bit and try again (in case of race condition)
        const timer = setTimeout(() => {
          if (!loadImageResults()) {
            setResults([]);
            setTotalResults(0);
            setIsLoading(false);
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [searchType]);

  // Fetch search results for text search
  useEffect(() => {
    const fetchResults = async () => {
      // Skip for image search - handled in separate useEffect
      if (searchType === "image") {
        return;
      }

      setIsImageSearch(false);

      if (!query || query.trim().length < 2) {
        setResults([]);
        setTotalResults(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await searchProducts(query.trim(), "full");
        
        if (data.success !== false) {
          setResults(data.results || []);
          setTotalResults(data.totalResults || 0);
        } else {
          setResults([]);
          setTotalResults(0);
          setError(data.message);
        }
      } catch (err) {
        setError("Failed to load search results");
        setResults([]);
        setTotalResults(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, searchType]);

  // Format price in Rupees
  const formatPrice = (price) => {
    return `Rs ${new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)}`;
  };

  // Get image URL
  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `${API_BASE}${image.startsWith("/") ? "" : "/"}${image}`;
  };

  // Navigate to product
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Navigate to category
  const handleCategoryClick = (slug) => {
    navigate(`/category/${slug}`);
  };

  const hasResults = results.length > 0;
  const showEmpty = !isLoading && !hasResults && (query.trim().length >= 2 || isImageSearch);

  return (
    <Layout>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            {isImageSearch ? (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "8px", verticalAlign: "middle" }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Image Search Results
              </>
            ) : query ? (
              <>Search results for "<span className={styles.query}>{query}</span>"</>
            ) : (
              "Search Products"
            )}
          </h1>
          {!isLoading && hasResults && (
            <p className={styles.count}>
              {totalResults} {isImageSearch ? "matching" : ""} product{totalResults !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>{isImageSearch ? "Finding matching products..." : "Searching products..."}</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className={styles.error}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Results Grid */}
        {!isLoading && hasResults && (
          <div className={styles.grid}>
            {results.map((product) => {
              const imageUrl = getImageUrl(product.image);
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  className={`${styles.card} ${isOutOfStock ? styles.outOfStock : ""}`}
                  onClick={() => handleProductClick(product.id)}
                >
                  {/* Image */}
                  <div className={styles.imageWrapper}>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className={styles.image}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                    {/* Stock Badge */}
                    {isOutOfStock ? (
                      <div className={styles.stockBadge + " " + styles.out}>Out of Stock</div>
                    ) : product.stock <= 5 ? (
                      <div className={styles.stockBadge + " " + styles.low}>Low Stock</div>
                    ) : null}
                  </div>

                  {/* Info */}
                  <div className={styles.info}>
                    <span className={styles.category}>{product.category}</span>
                    <h3 className={styles.name}>{product.name}</h3>
                    <div className={styles.priceRow}>
                      <span className={styles.price}>{formatPrice(product.price)}</span>
                      {product.oldPrice && product.oldPrice > product.price && (
                        <span className={styles.oldPrice}>{formatPrice(product.oldPrice)}</span>
                      )}
                    </div>
                    {product.avgRating > 0 && (
                      <div className={styles.rating}>
                        <span className={styles.stars}>
                          {"★".repeat(Math.round(product.avgRating))}
                          {"☆".repeat(5 - Math.round(product.avgRating))}
                        </span>
                        <span className={styles.ratingCount}>({product.ratingCount})</span>
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <button type="button" className={styles.viewBtn}>
                    View Product
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {showEmpty && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              {isImageSearch ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                  <path d="M8 8l6 6M14 8l-6 6" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                  <path d="M8 8l6 6M14 8l-6 6" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <h2 className={styles.emptyTitle}>
              {isImageSearch ? (
                "No matching products found"
              ) : (
                <>Sorry, we couldn't find "<span>{query}</span>"</>
              )}
            </h2>
            <p className={styles.emptySubtitle}>
              {isImageSearch
                ? "Try uploading a product image from our store for better results"
                : "Try a different search term or browse our categories"
              }
            </p>
            <div className={styles.categories}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  className={styles.categoryChip}
                  onClick={() => handleCategoryClick(cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Query State */}
        {!query && !isImageSearch && !isLoading && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>Search for products</h2>
            <p className={styles.emptySubtitle}>
              Enter a search term to find products
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
