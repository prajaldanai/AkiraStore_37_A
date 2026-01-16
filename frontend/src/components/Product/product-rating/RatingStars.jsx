// src/components/Product/product-rating/RatingStars.jsx
/**
 * RatingStars - Interactive star rating component
 * 
 * CRITICAL: All click events must be stopped from propagating
 * to prevent parent elements (cards, links) from intercepting them
 * and causing navigation or page reload.
 */
export default function RatingStars({
  value = 0,
  readOnly = false,
  hoverValue = 0,
  onHover,
  onChange,
  size = 22,
}) {
  const display = hoverValue || value;

  /**
   * Handle star click with proper event handling
   * Prevents event from bubbling up to parent elements
   */
  const handleStarClick = (event, starValue) => {
    event.preventDefault();
    event.stopPropagation();
    if (!readOnly && onChange) {
      onChange(starValue);
    }
  };

  return (
    <div 
      className={`rating-stars ${readOnly ? "is-readonly" : ""}`}
      onClick={(e) => e.stopPropagation()} // Extra safety: stop any click bubbling
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= display;
        return (
          <button
            key={n}
            type="button"
            className={`star-btn ${active ? "active" : ""}`}
            style={{ fontSize: size }}
            disabled={readOnly}
            onMouseEnter={() => !readOnly && onHover?.(n)}
            onMouseLeave={() => !readOnly && onHover?.(0)}
            onClick={(e) => handleStarClick(e, n)}
            aria-label={`${n} star${active ? " selected" : ""}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
