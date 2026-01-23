import Layout from "../../components/Layout/Layout";
import FeedbackForm from "./FeedbackForm";
import styles from "./FeedbackPage.module.css";

export default function FeedbackPage() {
  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.cardWrapper}>
          <FeedbackForm />
        </div>
      </div>
    </Layout>
  );
}
