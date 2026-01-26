import React, { useState } from "react";
import styles from "./ProductDescription.module.css";

export default function ProductDescription({ productName, descriptionSummary }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const text = descriptionSummary?.trim() || "";
  const paragraphs = text ? text.split(/\n+/).filter(p => p.trim()) : [];
  
  // Show only first 2 paragraphs when collapsed, or limit by character count
  const MAX_COLLAPSED_CHARS = 300;
  const MAX_COLLAPSED_PARAGRAPHS = 2;
  
  // Calculate if content should be collapsible
  const totalChars = paragraphs.join(" ").length;
  const shouldCollapse = totalChars > MAX_COLLAPSED_CHARS || paragraphs.length > MAX_COLLAPSED_PARAGRAPHS;
  
  // Get visible paragraphs based on expanded state
  const getVisibleContent = () => {
    if (!shouldCollapse || isExpanded) {
      return paragraphs;
    }
    
    // Show limited paragraphs when collapsed
    let charCount = 0;
    const visibleParagraphs = [];
    
    for (const para of paragraphs) {
      if (charCount + para.length <= MAX_COLLAPSED_CHARS && visibleParagraphs.length < MAX_COLLAPSED_PARAGRAPHS) {
        visibleParagraphs.push(para);
        charCount += para.length;
      } else {
        // Add truncated version of last paragraph if needed
        if (visibleParagraphs.length === 0) {
          visibleParagraphs.push(para.substring(0, MAX_COLLAPSED_CHARS) + "...");
        }
        break;
      }
    }
    
    return visibleParagraphs;
  };

  const visibleParagraphs = getVisibleContent();

  return (
    <section className={styles.descriptionSection}>
      <div className={styles.content}>
        {productName && <h4 className={styles.productName}>{productName}</h4>}
        <div className={`${styles.textContainer} ${isExpanded ? styles.expanded : styles.collapsed}`}>
          {visibleParagraphs.length > 0 ? (
            visibleParagraphs.map((para, idx) => (
              <p key={idx} className={styles.paragraph}>{para}</p>
            ))
          ) : (
            <p className={styles.paragraph}>No description available.</p>
          )}
        </div>
        {shouldCollapse && (
          <button 
            className={styles.readMoreBtn}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>
                <span>Show Less</span>
                <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </>
            ) : (
              <>
                <span>Read More</span>
                <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}