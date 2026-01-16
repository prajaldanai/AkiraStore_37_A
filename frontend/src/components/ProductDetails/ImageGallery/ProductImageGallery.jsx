import { useEffect, useState, useCallback, useRef } from "react";
import styles from "./ProductImageGallery.module.css";

const PLACEHOLDER = "https://via.placeholder.com/400x400?text=No+Image";

export default function ProductImageGallery({ images = [] }) {
  const [mainIdx, setMainIdx] = useState(0);
  const [zoomLocked, setZoomLocked] = useState(false);

  const wrapperRef = useRef(null);
  const hasMultiple = images.length > 1;

  const resolveImage = (img) =>
    img?.startsWith("/uploads") ? `http://localhost:5000${img}` : img;

  /* ===============================
     IMAGE NAVIGATION
  =============================== */
  const handlePrev = useCallback(() => {
    if (!hasMultiple) return;
    setMainIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [hasMultiple, images.length]);

  const handleNext = useCallback(() => {
    if (!hasMultiple) return;
    setMainIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [hasMultiple, images.length]);

  useEffect(() => {
    setMainIdx(0);
    setZoomLocked(false);
  }, [images]);

  /* ===============================
     MOVEABLE ZOOM (CURSOR FOLLOW)
  =============================== */
  const handleMouseMove = (e) => {
    if (!wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    wrapperRef.current.style.setProperty("--zoom-x", `${x}%`);
    wrapperRef.current.style.setProperty("--zoom-y", `${y}%`);
  };

  /* ===============================
     ESC KEY → RESET ZOOM
  =============================== */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setZoomLocked(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const mainImageSrc = images.length
    ? resolveImage(images[mainIdx])
    : PLACEHOLDER;

  return (
    <div className={styles.gallery}>
      {/* ===============================
          MAIN IMAGE
      =============================== */}
      <div
        ref={wrapperRef}
        className={`${styles.mainImageWrapper} ${
          zoomLocked ? styles.zoomLocked : ""
        }`}
        onMouseMove={handleMouseMove}
        onClick={() => setZoomLocked((prev) => !prev)}
      >
        <img
          src={mainImageSrc}
          alt="Product"
          className={styles.mainImage}
          draggable={false}
        />
      </div>

      {/* ===============================
          THUMBNAILS
      =============================== */}
      {hasMultiple && (
        <div className={styles.thumbnailRow}>
          <button className={styles.arrowBtn} onClick={handlePrev}>‹</button>

          <div className={styles.thumbnails}>
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setMainIdx(idx);
                  setZoomLocked(false);
                }}
                className={`${styles.thumbnail} ${
                  idx === mainIdx ? styles.active : ""
                }`}
              >
                <img
                  src={resolveImage(img)}
                  alt=""
                  className={styles.thumbnailImg}
                  draggable={false}
                />
              </button>
            ))}
          </div>

          <button className={styles.arrowBtn} onClick={handleNext}>›</button>
        </div>
      )}
    </div>
  );
}
