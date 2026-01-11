// src/components/Product/product-rating/RatingStars.jsx

export default function RatingStars({ rating, ratingCount, onOpen }) {
  return (
    <div
      className="rating-block"
      onClick={(e) => {
        e.stopPropagation(); // 🔥 IMPORTANT
        onOpen();
      }}
      role="button"
    >
      <div className="rating-right">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.round(rating);
          return (
            <span
              key={i}
              className={`star ${filled ? "filled" : ""}`}
            >
              ★
            </span>
          );
        })}
      </div>

      <p className="rating-count">
        ({ratingCount} people rated)
      </p>
    </div>
  );
}