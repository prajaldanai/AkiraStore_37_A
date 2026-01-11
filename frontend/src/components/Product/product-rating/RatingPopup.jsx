// src/components/Product/product-rating/RatingPopup.jsx
import ReactDOM from "react-dom";
import { useEffect } from "react";

export default function RatingPopup({
  rating,
  hoverRate,
  setHoverRate,
  onSubmit,
  onClose,
}) {
  // ✅ Ensure portal root exists
  let portalRoot = document.getElementById("popup-root");
  if (!portalRoot) {
    portalRoot = document.createElement("div");
    portalRoot.id = "popup-root";
    document.body.appendChild(portalRoot);
  }

  // ✅ Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className="rating-popup"
      onClick={onClose} // backdrop click
      style={{ zIndex: 9999 }}
    >
      <div
        className="rating-popup-box"
        onClick={(e) => e.stopPropagation()} // 🔥 prevent close
      >
        <h2 className="rating-title">Rate this Product</h2>

        <div className="rating-popup-stars">
          {Array.from({ length: 5 }).map((_, i) => {
            const num = i + 1;
            const filled = num <= (hoverRate || rating);

            return (
              <span
                key={num}
                className={`rating-star ${filled ? "filled" : ""}`}
                onMouseEnter={() => setHoverRate(num)}
                onMouseLeave={() => setHoverRate(0)}
                onClick={() => onSubmit(num)}
                role="button"
              >
                ★
              </span>
            );
          })}
        </div>

        <button className="rating-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>,
    portalRoot
  );
}
