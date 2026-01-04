// src/components/Product/product-actions/HoverActions.jsx
import eye from "../../../assets/icons/eye.png";
import star from "../../../assets/icons/star.png";
import cart from "../../../assets/icons/cart.png";

export default function HoverActions({ onRate }) {
  return (
    <div className="center-hover-icons">
      <div className="hover-icon-box">
        <img src={eye} alt="View" className="hover-icon" />
      </div>

      <div
        className="hover-icon-box"
        onClick={(e) => {
          e.stopPropagation();
          onRate && onRate();
        }}
        role="button"
      >
        <img src={star} alt="Rate" className="hover-icon" />
      </div>

      <div className="hover-icon-box">
        <img src={cart} alt="Add to cart" className="hover-icon" />
      </div>
    </div>
  );
}
