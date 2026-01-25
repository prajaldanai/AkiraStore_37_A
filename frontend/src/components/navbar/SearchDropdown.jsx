/**
 * SearchDropdown Component
 * Dropdown for search results
 */

import SearchResultItem from "./SearchResultItem";
import SearchEmptyState from "./SearchEmptyState";
import styles from "./SearchDropdown.module.css";

export default function SearchDropdown({
  isOpen,
  isLoading,
  query,
  results,
  totalResults,
  selectedIndex,
  onResultClick,
  onResultHover,
  onClose,
  onViewAll,
}) {
  if (!isOpen) return null;

  const hasResults = results.length > 0;
  const showEmpty = !isLoading && query.trim().length >= 2 && !hasResults;
  const showViewAll = hasResults && totalResults > results.length;

  return (
    <div className={styles.dropdown}>
      {/* Loading State */}
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Searching...</span>
        </div>
      )}

      {/* Results */}
      {!isLoading && hasResults && (
        <>
          <div className={styles.results}>
            {results.map((product, index) => (
              <SearchResultItem
                key={product.id}
                product={product}
                query={query}
                isSelected={index === selectedIndex}
                onClick={onResultClick}
                onMouseEnter={() => onResultHover(index)}
              />
            ))}
          </div>

          {/* View All */}
          {showViewAll && (
            <button
              type="button"
              className={styles.viewAll}
              onClick={onViewAll}
            >
              <span>View all {totalResults} results</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* Empty State */}
      {showEmpty && (
        <SearchEmptyState query={query} onCategoryClick={onClose} />
      )}

      {/* Keyboard Hint */}
      {hasResults && (
        <div className={styles.hint}>
          <span>
            <kbd>↑</kbd><kbd>↓</kbd> to navigate
          </span>
          <span>
            <kbd>Enter</kbd> to select
          </span>
          <span>
            <kbd>Esc</kbd> to close
          </span>
        </div>
      )}
    </div>
  );
}
