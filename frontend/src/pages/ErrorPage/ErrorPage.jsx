import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import styles from "./ErrorPage.module.css";

// Error illustration from assets
import errorIllustration from "../../assets/images/page-not-found.png";

/**
 * Reusable Error Page
 * Used for:
 * - 404 Page Not Found
 * - Invalid order ID
 * - Unauthorized access
 * - Any other error state
 */
const ErrorPage = ({ 
  errorCode = "404",
  title = "Page not found",
  description = "Sorry, we couldn't find the page you're looking for. The page may have been moved, deleted, or never existed.",
  showBackButton = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Allow custom error info from navigation state
  const stateErrorCode = location.state?.errorCode;
  const stateTitle = location.state?.title;
  const stateDescription = location.state?.description;

  const displayCode = stateErrorCode || errorCode;
  const displayTitle = stateTitle || title;
  const displayDescription = stateDescription || description;

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/dashboard");
  };

  const handleBackButton = () => {
    navigate(-1);
  };

  return (
    <Layout>
      <div className={styles.container}>
        {/* Back Button */}
        {showBackButton && (
          <button className={styles.backButton} onClick={handleBackButton}>
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
        )}

        {/* Page Title */}
        <h1 className={styles.pageTitle}>Product Confirmation</h1>

        {/* Main Content - Two Columns */}
        <div className={styles.mainContent}>
          {/* Left Panel - Error Illustration */}
          <div className={styles.leftPanel}>
            <div className={styles.illustrationCard}>
              <img
                src={errorIllustration}
                alt="Error"
                className={styles.illustration}
              />
            </div>
          </div>

          {/* Right Panel - Error Message */}
          <div className={styles.rightPanel}>
            <div className={styles.errorCard}>
              {/* Red X Icon */}
              <div className={styles.iconWrapper}>
                <svg
                  className={styles.errorIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>

              <h2 className={styles.errorTitle}>
                {displayCode}, {displayTitle}
              </h2>

              <p className={styles.errorDescription}>
                {displayDescription}
              </p>

              {/* Action Buttons */}
              <div className={styles.buttonGroup}>
                <button
                  className={styles.primaryButton}
                  onClick={handleGoBack}
                >
                  GO BACK
                </button>
                <button
                  className={styles.secondaryButton}
                  onClick={handleGoHome}
                >
                  GO TO HOME
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ErrorPage;
