import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

import menHero from "../../assets/images/men-hero.png";
import electronicsHero from "../../assets/images/electronics-hero.png";
import kidsHero from "../../assets/images/kids-hero.png";
import shoesHero from "../../assets/images/shoes-hero.png";

export default function CategoryGrid() {
  const navigate = useNavigate();

  // --- LATEST PRODUCTS FROM BACKEND ---
  const [latest, setLatest] = useState({
    men: null,
    electronics: null,
    kids: null,
    shoes: null,
  });

  // --- CATEGORY LIST ---
  const items = [
    { title: "Men", sub: "best cloth for men", slug: "men", fallback: menHero },
    { title: "Electronic Product", sub: "Latest gadgets", slug: "electronics", fallback: electronicsHero },
    { title: "Kids", sub: "Best for kids", slug: "kids", fallback: kidsHero },
    { title: "Shoes", sub: "Premium shoes", slug: "shoes", fallback: shoesHero },
  ];

  // --- FETCH LATEST PRODUCT FOR EACH CATEGORY ---
  useEffect(() => {
    async function fetchLatest(slug) {
      try {
        const res = await fetch(`http://localhost:5000/api/products/latest/${slug}`);
        const data = await res.json();
        if (data.success && data.products.length > 0) {
          return data.products[0]; // FIRST PRODUCT
        }
      } catch (err) {
        console.error("Latest fetch failed:", slug, err);
      }
      return null;
    }

    async function loadAll() {
      const men = await fetchLatest("men");
      const electronics = await fetchLatest("electronics");
      const kids = await fetchLatest("kids");
      const shoes = await fetchLatest("shoes");

      setLatest({ men, electronics, kids, shoes });
    }

    loadAll();
  }, []);

  // Helper to choose image
  const getImage = (slug, fallback) => {
    const product = latest[slug];
    if (product?.main_image) {
      return `http://localhost:5000${product.main_image}`;
    }
    return fallback;
  };

  return (
    <div className="right-grid">
      {items.map((item, index) => (
        <div className="right-grid-card" key={index}>
          
          {/* Dynamic image or fallback */}
          <img
            src={getImage(item.slug, item.fallback)}
            className="right-grid-img"
            alt={item.title}
          />

          <div className="right-grid-overlay">
            <h2>{item.title}</h2>
            <p>{item.sub}</p>

            {/* Discover → Category Page */}
            <button
              className="discover-btn-sm"
              onClick={() => navigate(`/category/${item.slug}`)}
            >
              Discover More
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
