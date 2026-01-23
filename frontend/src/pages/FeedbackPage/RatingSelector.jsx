import styles from "./FeedbackPage.module.css";

const RATING_OPTIONS = [
  { value: 1, label: "Very Poor" },
  { value: 2, label: "Needs Work" },
  { value: 3, label: "Good" },
  { value: 4, label: "Very Good" },
  { value: 5, label: "Excellent" },
];

export const RatingSelector = ({ value, onChange }) => {
  return (
    <div className={styles.ratingSelector}>
      {RATING_OPTIONS.map((option) => {
        const isActive = value !== null && value >= option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={`${styles.ratingOption} ${isActive ? styles.ratingActive : ""}`}
            onClick={() =>
              onChange(value === option.value ? null : option.value)
            }
            aria-pressed={isActive}
          >
            <span className={styles.ratingValue}>{option.value}</span>
            <span className={styles.ratingLabel}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};
