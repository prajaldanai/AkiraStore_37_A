import React, { useState } from "react";
import { useNavigate } from "react-router-dom";   // ✅ NEW
import CategoryPanelPage from "./CategoryPanelPage";

import "./AdminDashboardPage.css";

// ICON IMPORTS
import homeIcon from "../assets/icons/home.png";
import categoryIcon from "../assets/icons/category.png";
import feedbackIcon from "../assets/icons/feedback.png";
import ordersIcon from "../assets/icons/orders.png";
import inventoryIcon from "../assets/icons/inventory.png";
import salesIcon from "../assets/icons/sales.png";
import usersIcon from "../assets/icons/users.png";
import orderHistoryIcon from "../assets/icons/orderHistory.png";

// DASHBOARD IMAGE
import dashboardBG from "../assets/images/dashboardBG.png";

const AdminDashboardPage = () => {

  const [showCategoryPanel, setShowCategoryPanel] = useState(false);

  const navigate = useNavigate();
  
  const handleLogout = () => {
    // Clear all auth-related data
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("userRole");
    navigate("/login", { replace: true });
  };


  return (
    <div className="outer-wrapper">
      <div className="dashboard-wrapper">

        {/* LEFT SIDEBAR */}
        <div className="sidebar">
          <div className="menu-item home-item active">
            <img src={homeIcon} alt="home" />
            <span>Home</span>
          </div>

          {/* CATEGORY BUTTON */}
          <div className="menu-item" onClick={() => setShowCategoryPanel(true)}>
            <img src={categoryIcon} alt="category" />
            <span>Category</span>
          </div>

          <div className="menu-item">
            <img src={feedbackIcon} alt="feedback" />
            <span>Feedback</span>
          </div>

          {/* ORDERS BUTTON - Navigate to Admin Orders */}
          <div className="menu-item" onClick={() => navigate("/admin/orders")}>
            <img src={ordersIcon} alt="orders" />
            <span>Orders</span>
          </div>

          <div className="menu-item">
            <img src={inventoryIcon} alt="inventory" />
            <span>Inventory</span>
          </div>

          <div className="menu-item">
            <img src={salesIcon} alt="sales" />
            <span>Sales Report</span>
          </div>

          <div className="menu-item">
            <img src={usersIcon} alt="users" />
            <span>Users</span>
          </div>

          {/* ORDER HISTORY BUTTON - Navigate to Order History */}
          <div className="menu-item" onClick={() => navigate("/admin/order-history")}>
            <img src={orderHistoryIcon} alt="order-history" />
            <span>Order History</span>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="dashboard-image-container">

          {/* LOGOUT BUTTON */}
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>

          {/* CATEGORY POPUP */}
          {showCategoryPanel && (
            <CategoryPanelPage onClose={() => setShowCategoryPanel(false)} />
          )}

          <img src={dashboardBG} className="dashboard-image" alt="dashboard" />
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
