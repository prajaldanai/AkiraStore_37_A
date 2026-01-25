/**
 * SearchEmptyState Component
 * Premium empty state when no results found
 */

import { useNavigate } from "react-router-dom";
import styles from "./SearchEmptyState.module.css";

const CATEGORIES = [
  { name: "Men", slug: "men" },
  { name: "Women", slug: "women" },
  { name: "Kids", slug: "kids" },
  { name: "Shoes", slug: "shoes" },
  { name: "Electronics", slug: "electronics" },
];

export default function SearchEmptyState({ query, onCategoryClick }) {
  const navigate = useNavigate();

  const handleCategoryClick = (slug) => {
    if (onCategoryClick) {
      onCategoryClick();
    }
    navigate(`/category/${slug}`);
  };

  return (
    <div className={styles.container}>
      {/* Icon */}
      <div className={styles.iconWrapper}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
          <path d="M8 8l6 6M14 8l-6 6" strokeLinecap="round" />
        </svg>
      </div>

      {/* Message */}
      <div className={styles.message}>
        <h4 className={styles.title}>
          Sorry, we couldn't find "<span className={styles.query}>{query}</span>"
        </h4>
        <p className={styles.subtitle}>
          Try a different name or browse our categories
        </p>
      </div>

      {/* Category Chips */}
      <div className={styles.categories}>
        {CATEGORIES.map((category) => (
          <button
            key={category.slug}
            type="button"
            className={styles.chip}
            onClick={() => handleCategoryClick(category.slug)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
