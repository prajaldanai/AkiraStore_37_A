import React, { useState } from "react";
import "./heroSection.css";

import women from "../../assets/images/women-hero.jpg";
import men from "../../assets/images/men-hero.jpg";
import electronics from "../../assets/images/electronics-hero.jpg";
import kids from "../../assets/images/kids-hero.jpg";
import shoes from "../../assets/images/shoes-hero.jpg";

function HeroCard({ data, expanded, setExpanded }) {
  return (
    <div
      className={`hero-container ${data.id === 0 ? "hero-left" : "hero-card"}`}
      data-open={expanded === data.id}
    >
      <div className="hero-inner">
        <img src={data.img} alt={data.title} />

        <div className="hero-overlay"></div>

        <div className="hero-text">
          <h2>{data.title}</h2>
          <p>{data.desc}</p>
        </div>

        {/* CENTER HOVER TRIGGER */}
       
       <div
  className="hover-trigger"
  onMouseEnter={() => setExpanded("h" + data.id)}
></div>

<div
  className={`hover-box ${
    expanded === "h" + data.id || expanded === data.id ? "active" : ""
  }`}
  onMouseLeave={() => setExpanded(null)}
>
  <h2>{data.title}</h2>
  <p>{data.hoverMsg}</p>
  <button
    className="discover-btn"
    onClick={() => setExpanded(data.id)}
  >
    Discover More
  </button>
</div>

      </div>
    </div>
  );
}

export default function HeroSection() {
  const [expanded, setExpanded] = useState(null);

  const cards = [
    {
      id: 0,
      img: women,
      title: "Women",
      desc: "Best Clothes For Women",
      hoverMsg: "Explore premium styles crafted for comfort, confidence, and elegance.",
    },
    {
      id: 1,
      img: shoes,
      title: "Shoes",
      desc: "Best Trend Shoes",
      hoverMsg: "Step into comfort and style with top-trend footwear collections.",
    },
    {
      id: 2,
      img: men,
      title: "Men",
      desc: "Best Clothes For Men",
      hoverMsg: "Discover the latest fashion essentials designed for modern men.",
    },
    {
      id: 3,
      img: kids,
      title: "Kids",
      desc: "Best Clothes For Kids",
      hoverMsg: "Find adorable, soft, and stylish outfits your kids will love.",
    },
    {
      id: 4,
      img: electronics,
      title: "Electronic Product",
      desc: "Best Trend Electronics",
      hoverMsg: "Upgrade your lifestyle with trending gadgets and smart devices.",
    },
  ];

  return (
    <div className="hero-wrapper">
      <HeroCard data={cards[0]} expanded={expanded} setExpanded={setExpanded} />

      <div className="hero-right">
        {cards.slice(1).map((c) => (
          <HeroCard
            key={c.id}
            data={c}
            expanded={expanded}
            setExpanded={setExpanded}
          />
        ))}
      </div>
    </div>
  );
}
