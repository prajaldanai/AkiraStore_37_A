import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminFeedbackPage.module.css";

// Global admin font lock - ensures consistent font sizing across all devices
import "../../styles/adminGlobal.css";

const STORAGE_KEY = "akira_store_feedback";

// Rating labels matching user form
const RATING_LABELS = {
  1: "Very Poor",
  2: "Needs Work",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

function readFeedbackEntries() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("readFeedbackEntries", error);
    return [];
  }
}

export default function AdminFeedbackPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    setEntries(readFeedbackEntries());
  }, []);

  const stats = useMemo(() => {
    if (!entries.length) return { total: 0, average: 0, distribution: {} };
    const average =
      entries.reduce((sum, entry) => sum + (Number(entry.rating) || 0), 0) / entries.length;
    
    // Calculate rating distribution
    const distribution = entries.reduce((acc, entry) => {
      const rating = entry.rating;
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    return {
      total: entries.length,
      average: Number(average.toFixed(1)),
      distribution,
    };
  }, [entries]);

  const getRatingColor = (rating) => {
    const colors = {
      1: "#ef4444",
      2: "#f97316",
      3: "#eab308",
      4: "#22c55e",
      5: "#10b981",
    };
    return colors[rating] || "#6b7280";
  };

  return (
    <div className={styles.page} data-admin="true">
      {/* Header with Back Button */}
      <header className={styles.topHeader}>
        <button 
          className={styles.backBtn}
          onClick={() => navigate("/admin-dashboard")}
          aria-label="Back to Dashboard"
        >
          <span className={styles.backArrow}>←</span>
          <span>Back</span>
        </button>
        <h1 className={styles.pageTitle}>User Feedback</h1>
        <div className={styles.headerSpacer}></div>
      </header>

      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <p className={styles.subTitle}>Admin Insights</p>
          <h1 className={styles.title}>User Feedback</h1>
          <p className={styles.headerDesc}>
            View and analyze feedback submitted by your customers
          </p>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <span className={styles.statLabel}>Total Responses</span>
              <strong className={styles.statValue}>{stats.total}</strong>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div>
              <span className={styles.statLabel}>Average Rating</span>
              <strong className={styles.statValue}>{stats.average || "—"} <small>/5</small></strong>
            </div>
          </div>
        </div>
      </header>

      {/* Feedback List */}
      {entries.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <h3>No Feedback Yet</h3>
          <p>When customers submit feedback, it will appear here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {entries
            .slice()
            .sort(
              (a, b) => new Date(b.submittedAt).valueOf() - new Date(a.submittedAt).valueOf()
            )
            .map((entry) => (
              <article key={entry.id} className={styles.card}>
                {/* Card Header with User Info */}
                <div className={styles.cardHeader}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      {(entry.username || "A").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={styles.username}>{entry.username || "Anonymous"}</p>
                      <p className={styles.timestamp}>
                        {new Date(entry.submittedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Rating Badge */}
                  <div 
                    className={styles.ratingBadge}
                    style={{ backgroundColor: getRatingColor(entry.rating) }}
                  >
                    <span className={styles.ratingNumber}>{entry.rating}</span>
                    <span className={styles.ratingLabel}>{RATING_LABELS[entry.rating]}</span>
                  </div>
                </div>

                {/* Feedback Content */}
                <div className={styles.cardBody}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      Overall Experience
                    </label>
                    <div className={styles.ratingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`${styles.star} ${star <= entry.rating ? styles.starFilled : ""}`}
                        >
                          ★
                        </span>
                      ))}
                      <span className={styles.ratingText}>
                        {entry.rating}/5 - {RATING_LABELS[entry.rating]}
                      </span>
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      Improvement Suggestions
                    </label>
                    <p className={styles.feedbackText}>
                      {entry.improvement || "No suggestions provided."}
                    </p>
                  </div>
                </div>
              </article>
            ))}
        </div>
      )}
    </div>
  );
}
