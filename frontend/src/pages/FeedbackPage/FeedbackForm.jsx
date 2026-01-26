import { useEffect, useState } from "react";
import { Check, Send } from "lucide-react";
import { RatingSelector } from "./RatingSelector";
import { getUserFromToken } from "../../utils/auth";
import styles from "./FeedbackPage.module.css";

const STORAGE_KEY = "akira_store_feedback";

const initialForm = {
  rating: null,
  improvement: "",
};

export default function FeedbackForm() {
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Get username from JWT token
    const user = getUserFromToken();
    if (user && user.username) {
      setUsername(user.username);
    } else {
      // Fallback to localStorage if available
      const stored = window?.localStorage.getItem("username") ?? "";
      setUsername(stored);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.rating === null) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      const payload = {
        id: Date.now(),
        rating: formData.rating,
        improvement: formData.improvement.trim(),
        username: username || "Anonymous",
        submittedAt: new Date().toISOString(),
      };
      const stored = (() => {
        try {
          const raw = window?.localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      })();
      const nextEntries = [...stored, payload];
      window?.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
      setFormData(initialForm);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialForm);
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className={`${styles.feedbackCard} ${styles.successCard}`}>
        <div className={styles.successIcon}>
          <Check className={styles.successCheck} strokeWidth={3} />
        </div>
        <h2 className={styles.successTitle}>Thank you! 💚</h2>
        <p className={styles.successText}>
          Your thoughtful feedback helps us improve your next visit. We appreciate you taking a
          minute to share it.
        </p>
        <button type="button" className={styles.secondaryButton} onClick={handleReset}>
          Leave more feedback
        </button>
      </div>
    );
  }

  const isValid = formData.rating !== null;

  return (
    <form className={styles.feedbackCard} onSubmit={handleSubmit}>
      <div className={styles.formHeading}>
        <p className={styles.subTitle}>Rate Your Experience</p>
        <h1 className={styles.title}>We'd love your feedback</h1>
        <p className={styles.helperCopy}>
          Give us a star rating and let us know how we can make your next shopping trip even better.
        </p>
      </div>

      <div className={styles.section}>
        <label className={styles.fieldLabel}>How was your overall experience?</label>
        <RatingSelector
          value={formData.rating}
          onChange={(rating) => setFormData((prev) => ({ ...prev, rating }))}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.fieldLabel}>What would make your experience better?</label>
        <textarea
          className={styles.inputField}
          value={formData.improvement}
          onChange={(event) =>
            setFormData((prev) => ({ ...prev, improvement: event.target.value }))
          }
          placeholder="Share your suggestions, ideas, or concerns..."
        />
      </div>

      <div className={styles.section}>
        <label className={styles.fieldLabel}>Username</label>
        <input
          className={styles.inputField}
          value={username}
          readOnly
          placeholder="Logged-in username"
        />
        <p className={styles.helperText}>
          Pulled from your account so we always know who’s sharing feedback.
        </p>
      </div>

      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className={styles.submitButton}
      >
        {isSubmitting ? (
          <span className={styles.spinner} aria-label="Sending feedback" />
        ) : (
          <>
            <Send className={styles.icon} />
            <span>Send Feedback</span>
          </>
        )}
      </button>
    </form>
  );
}
