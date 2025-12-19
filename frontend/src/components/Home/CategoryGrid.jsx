// src/components/Home/CategoryGrid.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

import menHero from "../../assets/images/men-hero.jpg";
import electronicsHero from "../../assets/images/electronics-hero.jpg";
import kidsHero from "../../assets/images/kids-hero.jpg";
import shoesHero from "../../assets/images/shoes-hero.jpg";

export default function CategoryGrid() {
  const navigate = useNavigate();

  // Store dynamic latest images
  const [latest, setLatest] = useState({
    men: null,
    electronics: null,
    kids: null,
    shoes: null,
  });

  // Categories configuration
  const data = [
    { title: "Men", sub: "best cloth for men", slug: "men", fallback: menHero },
    { title: "Electronic Product", sub: "Latest gadgets", slug: "electronics", fallback: electronicsHero },
    { title: "Kids", sub: "Best for kids", slug: "kids", fallback: kidsHero },
    { title: "Shoes", sub: "Premium shoes", slug: "shoes", fallback: shoesHero },
  ];

  // Fetch latest products for all categories
  useEffect(() => {
    async function fetchLatest(slug) {
      try {
        const res = await fetch(`http://localhost:5000/api/products/latest/${slug}`);
        const data = await res.json();
        if (data.success && data.products.length > 0) {
          return data.products[0]; // newest item
        }
      } catch (err) {
        console.log("Fetch error:", slug, err);
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

  // Select backend image or fallback
  const getImage = (slug, fallback) => {
    const product = latest[slug];
    if (product?.main_image) {
      return `http://localhost:5000${product.main_image}`;
    }
    return fallback;
  };

  return (
    <div className="grid-wrapper">
      {data.map((item, i) => (
        <div className="grid-card" key={i}>
          
          {/* Dynamic image */}
          <img 
            src={getImage(item.slug, item.fallback)} 
            className="grid-img" 
            alt={item.title}
          />

          <div className="grid-overlay">
            <h2>{item.title}</h2>
            <p>{item.sub}</p>

            <button onClick={() => navigate(`/category/${item.slug}`)}>
              Discover More
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}