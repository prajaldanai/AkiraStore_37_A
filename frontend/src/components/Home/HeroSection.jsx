import React from "react";
import { useNavigate } from "react-router-dom";
import "./heroSection.css";

import women from "../../assets/images/women-hero.jpg";
import men from "../../assets/images/men-hero.jpg";
import electronics from "../../assets/images/electronics-hero.jpg";
import kids from "../../assets/images/kids-hero.jpg";
import shoes from "../../assets/images/shoes-hero.jpg";

/* ===============================
   HERO CARD
================================ */
function HeroCard({ data, onDiscover }) {
  return (
    <div className={`hero-container ${data.id === 0 ? "hero-left" : "hero-card"}`}>
      <div className="hero-inner">
        <img src={data.img} alt={data.title} />
        <div className="hero-overlay" />

        <div className="hover-zone">
          {/* DEFAULT TEXT */}
          <div className="hero-text">
            <h2>{data.title}</h2>
            <p>{data.desc}</p>
          </div>

          {/* HOVER CONTENT */}
          <div className="hover-box">
            <h2>{data.title}</h2>
            <p>{data.hoverMsg}</p>
            <button
              className="discover-btn"
              onClick={onDiscover}
            >
              Discover More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   HERO SECTION
================================ */
export default function HeroSection() {
  const navigate = useNavigate();

  const cards = [
    {
      id: 0,
      img: women,
      title: "Women",
      desc: "Best Clothes For Women",
      hoverMsg:
        "Explore premium styles crafted for comfort, confidence, and elegance.",
      path: "/category/women",
    },
    {
      id: 1,
      img: shoes,
      title: "Shoes",
      desc: "Best Trend Shoes",
      hoverMsg:
        "Step into comfort and style with top-trend footwear collections.",
      path: "/shoes",
    },
    {
      id: 2,
      img: men,
      title: "Men",
      desc: "Best Clothes For Men",
      hoverMsg:
        "Discover the latest fashion essentials designed for modern men.",
      path: "/category/men",
    },
    {
      id: 3,
      img: kids,
      title: "Kids",
      desc: "Best Clothes For Kids",
      hoverMsg:
        "Find adorable, soft, and stylish outfits your kids will love.",
      path: "/category/kids",
    },
    {
      id: 4,
      img: electronics,
      title: "Electronic Product",
      desc: "Best Trend Electronics",
      hoverMsg:
        "Upgrade your lifestyle with trending gadgets and smart devices.",
      path: "/electronics",
    },
  ];

  return (
    <div className="hero-wrapper">
      {/* LEFT BIG CARD */}
      <HeroCard
        data={cards[0]}
        onDiscover={() => navigate(cards[0].path)}
      />

      {/* RIGHT GRID CARDS */}
      <div className="hero-right">
        {cards.slice(1).map((card) => (
          <HeroCard
            key={card.id}
            data={card}
            onDiscover={() => navigate(card.path)}
          />
        ))}
      </div>
    </div>
  );
}
