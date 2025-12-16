import React from "react";
import "./CategoryPanelPage.css";
import { useNavigate } from "react-router-dom";

const CategoryPanelPage = ({ onClose }) => {
  const navigate = useNavigate();

  // Slugs MUST match the database categories table
  const categories = [
    { name: "Men Clothes", slug: "men" },
    { name: "Women Clothes", slug: "women" },
    { name: "Kids Clothes", slug: "kids" },
    { name: "Glasses", slug: "glasses" },
    { name: "Shoes", slug: "shoes" },
    { name: "Grocery", slug: "grocery" },
    { name: "Electronics", slug: "electronics" }, // ✅ FIX ADDED
  ];

  const handleCategoryClick = (slug) => {
    navigate(`/admin/category/${slug}`);
    if (onClose) onClose(); // close popup after click
  };

  return (
    <div className="category-panel animate-panel">
      {/* Close Button */}
      <button className="category-close-btn" onClick={onClose}>
        ✖
      </button>

      {/* Category List */}
      <ul className="category-panel-list">
        {categories.map((item) => (
          <li key={item.slug} onClick={() => handleCategoryClick(item.slug)}>
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryPanelPage;
