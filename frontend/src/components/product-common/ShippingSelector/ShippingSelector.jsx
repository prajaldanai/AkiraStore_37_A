import React, { useEffect, useMemo, useState } from "react";
import styles from "./ShippingSelector.module.css";

const defaultGetOptions = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.shippingOptions)) return data.shippingOptions;
  if (Array.isArray(data?.options)) return data.options;
  if (Array.isArray(data?.rules)) return data.rules;
  return [];
};

export default function ShippingSelector({
  fetchUrl,
  selectedId,
  autoSelectFirst = false,
  title = "Shipping Options",
  emptyMessage = "No shipping options available.",
  getOptions = defaultGetOptions,
  onSelect,
  onLoad,
  onError,
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fetchUrl) return;
    let isMounted = true;

    const loadOptions = async () => {
      try {
        setLoading(true);
        const res = await fetch(fetchUrl);
        const data = await res.json();
        const nextOptions = getOptions(data) || [];

        if (!isMounted) return;
        setOptions(nextOptions);
        if (onLoad) onLoad(nextOptions, data);
      } catch (err) {
        if (!isMounted) return;
        setOptions([]);
        if (onError) onError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOptions();
    return () => {
      isMounted = false;
    };
  }, [fetchUrl, getOptions, onLoad, onError]);

  const normalizedOptions = useMemo(
    () => options.map((option, index) => ({
      ...option,
      _id: option.id ?? option.key ?? option.value ?? index,
    })),
    [options]
  );

  useEffect(() => {
    if (!autoSelectFirst || normalizedOptions.length === 0) return;
    if (selectedId !== null && selectedId !== undefined) return;
    if (onSelect) onSelect(normalizedOptions[0]);
  }, [autoSelectFirst, normalizedOptions, onSelect, selectedId]);

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {loading && <span className={styles.loading}>Loading</span>}
      </div>

      {normalizedOptions.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ul className={styles.list}>
          {normalizedOptions.map((option) => (
            <li key={option._id} className={styles.item}>
              <label className={styles.option}>
                <input
                  type="radio"
                  name="shippingOption"
                  checked={option._id === selectedId}
                  onChange={() => onSelect && onSelect(option)}
                />
                <div>
                  <div className={styles.optionLabel}>{option.label || option.name || "Shipping"}</div>
                  {option.description && (
                    <div className={styles.optionDesc}>{option.description}</div>
                  )}
                </div>
                <span className={styles.amount}>Rs. {Number(option.amount) || 0}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
