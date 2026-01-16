import React from "react";
import styles from "./Footer.module.css";
import logo from "../../assets/icons/logo.png";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* LEFT SIDE */}
        <div className={styles.left}>
          <img
            src={logo}
            alt="AkiraStore"
            className={styles.logo}
          />

          <p className={styles.text}>
            <strong>Address:</strong> Kathmandu, Nepal
          </p>
          <p className={styles.text}>
            <strong>Email:</strong> support@akirastore.com
          </p>
          <p className={styles.text}>
            <strong>Phone:</strong> +977 9800000000
          </p>
        </div>

        {/* SHOPPING CATEGORY */}
        <div className={styles.col}>
          <h3 className={styles.title}>Shopping & Category</h3>

          <p className={styles.link}>Men’s Clothing</p>
          <p className={styles.link}>Women Clothing</p>
          <p className={styles.link}>Kids Clothing</p>
          <p className={styles.link}>Shoes</p>
          <p className={styles.link}>Electronics</p>
        </div>

        {/* USEFUL LINKS */}
        <div className={styles.col}>
          <h3 className={styles.title}>Useful Links</h3>

          <p className={styles.link}>Home</p>
          <p className={styles.link}>About Us</p>
          <p className={styles.link}>My Cart</p>
        </div>
      </div>
    </footer>
  );
}
