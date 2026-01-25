/**
 * SearchResultItem Component
 * Single search result item in dropdown
 */

import styles from "./SearchResultItem.module.css";

const API_BASE = "http://localhost:5000";

export default function SearchResultItem({
  product,
  query,
  isSelected,
  onClick,
  onMouseEnter,
}) {
  // Highlight matching text in product name
  const highlightMatch = (text, searchQuery) => {
    if (!searchQuery || !text) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + searchQuery.length);
    const after = text.slice(index + searchQuery.length);

    return (
      <>
        {before}
        <mark className={styles.highlight}>{match}</mark>
        {after}
      </>
    );
  };

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

  const imageUrl = getImageUrl(product.image);
  const isOutOfStock = product.stock <= 0;

  return (
    <button
      type="button"
      className={`${styles.item} ${isSelected ? styles.selected : ""} ${isOutOfStock ? styles.outOfStock : ""}`}
      onClick={() => onClick(product)}
      onMouseEnter={onMouseEnter}
    >
      {/* Product Image */}
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        {isOutOfStock && (
          <div className={styles.outOfStockBadge}>Out</div>
        )}
      </div>

      {/* Product Info */}
      <div className={styles.info}>
        <span className={styles.name}>
          {highlightMatch(product.name, query)}
        </span>
        <span className={styles.category}>{product.category}</span>
      </div>

      {/* Price */}
      <div className={styles.priceWrapper}>
        <span className={styles.price}>{formatPrice(product.price)}</span>
        {product.oldPrice && product.oldPrice > product.price && (
          <span className={styles.oldPrice}>{formatPrice(product.oldPrice)}</span>
        )}
      </div>

      {/* Arrow Icon */}
      <svg className={styles.arrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}
