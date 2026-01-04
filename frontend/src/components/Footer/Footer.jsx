import React from "react";
import "./footer.css";
import logo from "../../assets/icons/logo.png"; 

export default function Footer() {
  return (
    <div className="footer">
      <div className="footer-container">

        {/* LEFT SIDE */}
        <div className="footer-left">
          <img src={logo} alt="AkiraStore" className="footer-logo" />

          <p className="footer-text"><strong>Address:</strong> Kathmandu, Nepal</p>
          <p className="footer-text"><strong>Email:</strong> support@akirastore.com</p>
          <p className="footer-text"><strong>Phone:</strong> +977 9800000000</p>
        </div>

        {/* SHOPPING CATEGORY */}
        <div className="footer-col">
          <h3 className="footer-title">Shopping & Category</h3>

          <p className="footer-link">Men’s Clothing</p>
          <p className="footer-link">Women Clothing</p>
          <p className="footer-link">Kids Clothing</p>
          <p className="footer-link">Shoes</p>
          <p className="footer-link">Electronics</p>
        </div>

        {/* USEFUL LINKS */}
        <div className="footer-col">
          <h3 className="footer-title">Useful Links</h3>

          <p className="footer-link">Home</p>
          <p className="footer-link">About Us</p>
          <p className="footer-link">My Cart</p>
        </div>
      </div>
    </div>
  );
}
