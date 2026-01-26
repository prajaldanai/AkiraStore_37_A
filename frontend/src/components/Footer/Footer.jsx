import React from "react";
import { Link } from "react-router-dom";
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

          <Link to="/category/men" className={styles.link}>Men's Clothing</Link>
          <Link to="/category/women" className={styles.link}>Women's Clothing</Link>
          <Link to="/category/kids" className={styles.link}>Kids Clothing</Link>
          <Link to="/category/shoes" className={styles.link}>Shoes</Link>
          <Link to="/category/electronics" className={styles.link}>Electronics</Link>
        </div>

        {/* USEFUL LINKS */}
        <div className={styles.col}>
          <h3 className={styles.title}>Useful Links</h3>

          <Link to="/dashboard" className={styles.link}>Home</Link>
          <Link to="/about" className={styles.link}>About Us</Link>
          <Link to="/cart" className={styles.link}>My Cart</Link>
          <Link to="/orders" className={styles.link}>My Orders</Link>
          <Link to="/feedback" className={styles.link}>Feedback</Link>
        </div>
      </div>
    </footer>
  );
}
