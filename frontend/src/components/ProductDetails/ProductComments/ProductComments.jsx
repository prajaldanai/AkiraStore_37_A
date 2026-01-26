import React, { useState, useEffect } from "react";
import styles from "./ProductComments.module.css";
import { getToken, validateToken } from "../../../utils/auth";

const API_BASE = "http://localhost:5000/api";

export default function ProductComments({ productId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  // Check if user is logged in
  useEffect(() => {
    const token = getToken();
    const { valid } = validateToken(token);
    const storedUsername = localStorage.getItem("username");
    if (valid && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
  }, []);

  // Fetch comments for this product
  useEffect(() => {
    if (!productId) return;

    let isMounted = true;
    async function loadComments() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/comments/product/${productId}`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.comments)) {
          setComments(data.comments);
        }
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadComments();
    return () => { isMounted = false; };
  }, [productId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!formData.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    if (formData.trim().length < 5) {
      setError("Comment must be at least 5 characters");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          comment_text: formData.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to post comment");
        return;
      }

      // Add new comment to the list (prepend for newest first)
      const newComment = {
        id: data.comment.id,
        username: username || "Anonymous",
        comment_text: formData.trim(),
        created_at: new Date().toISOString(),
      };

      setComments([newComment, ...comments]);
      setFormData("");
    } catch (err) {
      console.error("Error posting comment:", err);
      setError("An error occurred while posting your comment");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <section className={styles.reviewsSection}>
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Customer Reviews</h3>
          <p className={styles.reviewCount}>
            {comments.length > 0
              ? `${comments.length} ${comments.length === 1 ? 'review' : 'reviews'}`
              : 'Be the first to review'}
          </p>
        </div>

        {/* Comment Form */}
        {isLoggedIn ? (
          <form onSubmit={handleSubmitComment} className={styles.reviewForm}>
            <textarea
              className={styles.reviewTextarea}
              placeholder="Share your thoughts about this product..."
              value={formData}
              onChange={(e) => {
                setFormData(e.target.value);
                setError(null);
              }}
              disabled={submitting}
              rows={4}
            />
            {error && <div className={styles.errorMessage}>{error}</div>}
            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.postButton}
                disabled={submitting || !formData.trim()}
              >
                {submitting ? "Posting..." : "Post Review"}
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.loginNotice}>
            <p>Please log in to share your review</p>
          </div>
        )}

        {/* Reviews List */}
        <div className={styles.reviewsList}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <span>Loading reviews...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <p className={styles.emptyTitle}>No reviews yet</p>
              <p className={styles.emptyDescription}>Be the first to share your thoughts about this product!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={styles.reviewCard}>
                <div className={styles.reviewAccent}></div>
                <div className={styles.reviewBody}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.userDetails}>
                      <span className={styles.avatar}>
                        {comment.username?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                      <span className={styles.username}>{comment.username}</span>
                    </div>
                    <span className={styles.timestamp}>
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className={styles.reviewText}>{comment.comment_text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
