import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./heroSection.css";

import logo from "../../assets/icons/logo.png";
import plusIcon from "../../assets/icons/plus.png";
import searchIcon from "../../assets/icons/search.png";

export default function HomeHeader() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("Home");

  const navItems = [
    "Home",
    "Women’s",
    "My cart",
    "Feedback",
    "Men’s",
    "Order Details",
    "Kid’s",
    "About US",
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/"); // login page
  };

  return (
    <header className="home-header">

      {/* LEFT LOGO */}
      <div className="header-left">
        <img src={logo} alt="logo" className="header-logo" />
      </div>

      {/* CENTER SEARCH */}
      <div className="header-center">
        <div className="search-bar">
          <img src={plusIcon} className="search-icon-left" alt="add" />
          <input type="text" placeholder="Search product..." />
          <img src={searchIcon} className="search-icon-right" alt="search" />
        </div>
      </div>

      {/* NAV + LOGOUT */}
      <div className="header-right">

        {/* NAVIGATION LINKS */}
        <div className="nav-links">
          {navItems.map((item) => (
            <button
              key={item}
              className={`nav-link ${activeNav === item ? "active" : ""}`}
              onClick={() => {
                setActiveNav(item);

                if (item === "Home") navigate("/dashboard");
                if (item === "Women’s") navigate("/women");
                if (item === "Men’s") navigate("/men");
                if (item === "Kid’s") navigate("/kids");

                // future navigation options:
                // if (item === "My cart") navigate("/cart");
                // if (item === "Feedback") navigate("/feedback");
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {/* LOGOUT BUTTON */}
        <button className="logout-text-btn" onClick={handleLogout}>
          Logout
        </button>

      </div>
    </header>
  );
}
