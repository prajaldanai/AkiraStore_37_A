import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import styles from "./OrderSuccessPage.module.css";

// Success illustration from assets
import successIllustration from "../../assets/images/order-sucess.png";

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const { orderId: paramOrderId } = useParams();
  const location = useLocation();
  
  // Get orderId from URL param or navigation state (fallback)
  const orderId = paramOrderId || location.state?.orderId;

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleViewOrder = () => {
    // Navigate to My Orders page, optionally highlighting the new order
    if (orderId) {
      navigate(`/orders?highlight=${orderId}`);
    } else {
      navigate("/orders");
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Layout>
      <div className={styles.container}>
        {/* Back Button */}
        <button className={styles.backButton} onClick={handleBack}>
          <span className={styles.backCircle}>
            <svg
              className={styles.backArrow}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
          <span className={styles.backText}>BACK</span>
        </button>

        {/* Page Title */}
        <h1 className={styles.pageTitle}>Product Confirmation</h1>

        {/* Main Content - Two Columns */}
        <div className={styles.mainContent}>
          {/* Left Panel - Illustration */}
          <div className={styles.leftPanel}>
            <div className={styles.illustrationCard}>
              <img
                src={successIllustration}
                alt="Order Success"
                className={styles.illustration}
              />
            </div>
          </div>

          {/* Right Panel - Success Message */}
          <div className={styles.rightPanel}>
            <div className={styles.successCard}>
              {/* Green Check Icon */}
              <div className={styles.iconWrapper}>
                <svg
                  className={styles.checkIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <h2 className={styles.successTitle}>
                Your order is successfully placed
              </h2>

              <p className={styles.successDescription}>
                Thank you for shopping with us! Your order has been confirmed and 
                will be processed shortly. You will receive an email with tracking details.
              </p>

              {orderId && (
                <div className={styles.orderIdBox}>
                  <span className={styles.orderIdLabel}>Order ID</span>
                  <span className={styles.orderIdValue}>{orderId}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className={styles.buttonGroup}>
                <button
                  className={styles.primaryButton}
                  onClick={handleGoToDashboard}
                >
                  GO TO DASHBOARD
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={handleViewOrder}
                >
                  VIEW ORDER
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderSuccessPage;
