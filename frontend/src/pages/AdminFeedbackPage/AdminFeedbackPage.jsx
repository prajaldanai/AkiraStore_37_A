import { useEffect, useMemo, useState } from "react";
import styles from "./AdminFeedbackPage.module.css";

const STORAGE_KEY = "akira_store_feedback";

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
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    setEntries(readFeedbackEntries());
  }, []);

  const stats = useMemo(() => {
    if (!entries.length) return { total: 0, average: 0 };
    const average =
      entries.reduce((sum, entry) => sum + (Number(entry.rating) || 0), 0) / entries.length;
    return {
      total: entries.length,
      average: Number(average.toFixed(1)),
    };
  }, [entries]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.subTitle}>Admin Insights</p>
          <h1 className={styles.title}>User Feedback</h1>
        </div>
        <div className={styles.stats}>
          <div>
            <span className={styles.statLabel}>Total submissions</span>
            <strong className={styles.statValue}>{stats.total}</strong>
          </div>
          <div>
            <span className={styles.statLabel}>Avg. rating</span>
            <strong className={styles.statValue}>{stats.average || "-"}</strong>
          </div>
        </div>
      </header>

      {entries.length === 0 ? (
        <div className={styles.empty}>
          <p>No feedback yet. The first submission will appear here.</p>
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
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.username}>{entry.username || "Anonymous"}</p>
                    <p className={styles.timestamp}>
                      {new Date(entry.submittedAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span className={styles.rating}>⭐ {entry.rating}/5</span>
                </div>
                <p className={styles.improvement}>{entry.improvement || "No details provided."}</p>
              </article>
            ))}
        </div>
      )}
    </div>
  );
}
