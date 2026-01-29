import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductSlider from "../Product/ProductSlider";
import styles from "./HomeSection.module.css";

export default function HomeSection({ title, subtitle, slug, viewPath }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  const isMountedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const slugRef = useRef(slug);
  const currentProductIdsRef = useRef("");

  useEffect(() => {
    slugRef.current = slug;
  }, [slug]);

  const loadProductsRef = useRef(async () => {
    if (!isMountedRef.current) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/user/products/latest/${slugRef.current}?limit=10`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (data.success && Array.isArray(data.products)) {
        const newIds = data.products.map(p => p.id).join(",");

        if (newIds !== currentProductIdsRef.current) {
          currentProductIdsRef.current = newIds;
          setProducts(data.products);
        }
      } else if (currentProductIdsRef.current !== "") {
        currentProductIdsRef.current = "";
        setProducts([]);
      }
    } catch {
      // keep existing products
    }
  });

  useEffect(() => {
    isMountedRef.current = true;

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadProductsRef.current();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      loadProductsRef.current();
    };

    window.addEventListener("PRODUCT_UPDATED", handleUpdate);

    return () => {
      window.removeEventListener("PRODUCT_UPDATED", handleUpdate);
    };
  }, []);

  const hideViewButton = slug === "grocery" || slug === "glasses";

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>

        {!hideViewButton && (
        <button
          type="button"
          className={styles.viewBtn}
          onClick={() => navigate(viewPath || `/category/${slug}`)}
        >
            View
          </button>
        )}
      </div>

      <p className={styles.subtitle}>{subtitle}</p>

      <ProductSlider items={products} />
    </section>
  );
}
