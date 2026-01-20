import AppHeader from "../Header/AppHeader";
import AppFooter from "../Footer/Footer";
import styles from "./Layout.module.css";

export default function Layout({ children }) {
  return (
    <>
      <AppHeader />
      <main className={styles.pageContent}>
        {children}
      </main>
      <AppFooter />
    </>
  );
}
