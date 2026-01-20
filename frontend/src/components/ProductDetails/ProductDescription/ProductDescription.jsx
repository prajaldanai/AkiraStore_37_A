import React from "react";
import styles from "./ProductDescription.module.css";

export default function ProductDescription({ productName, descriptionSummary }) {
  const text = descriptionSummary?.trim() || "";
  const paragraphs = text ? text.split(/\n+/).filter(p => p.trim()) : [];

  return (
    <section className={styles.descriptionSection}>
      <div className={styles.content}>
        {productName && <h4 className={styles.productName}>{productName}</h4>}
        {paragraphs.length > 0 ? (
          paragraphs.map((para, idx) => (
            <p key={idx} className={styles.paragraph}>{para}</p>
          ))
        ) : (
          <p className={styles.paragraph}>No description available.</p>
        )}
      </div>
    </section>
  );
}