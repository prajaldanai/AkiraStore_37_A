import React from "react";
import styles from "./style/hero.module.css";

export default function HeroSection({ config }) {
  if (!config || !config.showHero || !config.heroImage) return null;

  return (
    <section className={styles.heroContainer}>
      <div className={styles.heroInner}>

        {/* LEFT TEXT */}
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>
            {config.title}
          </h1>

          <p className={styles.heroSubtitle}>
            {config.subtitle}
          </p>
        </div>

        {/* RIGHT IMAGE */}
        <div className={styles.heroRight}>
          <img
            src={config.heroImage}
            alt="Hero model"
            className={styles.heroImg}
          />
        </div>

      </div>
    </section>
  );
}