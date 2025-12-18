import React from "react";
import "./style/hero.css";

export default function HeroSection({ config }) {
  return (
    <div className="hero-figma-container">

      {/* LEFT TEXT */}
      <div className="hero-left-figma">
        <h1 className="hero-title">{config.title}</h1>
        <p className="hero-sub">{config.subtitle}</p>
      </div>

      {/* RIGHT IMAGE */}
      <div className="hero-right-figma">
        <img src={config.heroImage} alt="model" className="hero-img" />
      </div>

    </div>
  );
}
