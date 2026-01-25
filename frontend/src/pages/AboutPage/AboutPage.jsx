import Layout from "../../components/Layout/Layout";
import styles from "./AboutPage.module.css";
import womenImage from "../../assets/images/imagewomen.png";
import walkImage from "../../assets/images/imagewalk.png";

export default function AboutPage() {
  return (
    <Layout>
      <section
        className={styles.hero}
        style={{ backgroundImage: `url(${womenImage})` }}
      >
        <div className={styles.heroOverlay} />
        <div className={styles.heroInner}>
          <h1 className={styles.title}>About Us</h1>

          <div className={styles.cards}>
            <article className={`${styles.card} ${styles.mission}`}>
              <h2>Mission Statement</h2>
              <p>
                We craft thoughtful, everyday essentials that blend comfort,
                durability, and standout design. Our mission is to make quality
                feel effortless, from first click to daily wear. We focus on
                dependable materials, smart details, and pricing that keeps
                great style within reach.
              </p>
            </article>

            <article className={`${styles.card} ${styles.vision}`}>
              <h2>Vision Statement</h2>
              <p>
                To build a trusted lifestyle store where families discover
                products that feel personal, modern, and made to last. We aim
                to be the go-to destination for pieces that look good today and
                stay relevant tomorrow.
              </p>
            </article>

            <article className={`${styles.card} ${styles.target}`}>
              <h2>Target Market Summary</h2>
              <p>
                We serve style-forward shoppers who value comfort, clean design,
                and reliable essentials for everyday life.
              </p>
              <img
                className={styles.targetImage}
                src={walkImage}
                alt="Illustration of people walking"
              />
            </article>

            <article className={`${styles.card} ${styles.values}`}>
              <h2>Core Values</h2>
              <p>
                Integrity in sourcing, care in details, and a commitment to
                inclusive, timeless design guide everything we build. We listen
                to our community, test for durability, and choose partners who
                share our standards for quality and fairness.
              </p>
            </article>

            <article className={`${styles.card} ${styles.history}`}>
              <h2>Brief Company History</h2>
              <p>
                AkiraStore started as a small neighborhood shop with a simple
                promise: dependable products and warm service. Today, we bring
                that same promise to a growing online community, delivering
                curated essentials while keeping the personal touch that built
                our name.
              </p>
            </article>
          </div>
        </div>
      </section>
    </Layout>
  );
}
