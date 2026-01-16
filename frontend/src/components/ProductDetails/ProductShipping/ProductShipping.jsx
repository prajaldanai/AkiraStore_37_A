import React from "react";
import styles from "./ProductShipping.module.css";

export default function ProductShipping({ shipping }) {
  const shippingOptions = [];

  const courierCharge = shipping?.courier_charge;
  const courierDesc = shipping?.courier_desc;
  const homeDelivery = shipping?.home_delivery_charge;
  const homeDeliveryDesc = shipping?.home_delivery_desc;
  const outsideValley = shipping?.outside_valley_charge;
  const outsideValleyDesc = shipping?.outside_valley_desc;

  if (courierCharge != null) {
    shippingOptions.push({
      icon: "🚚",
      label: "Courier Charge",
      amount: courierCharge,
      description: courierDesc || null
    });
  }

  if (homeDelivery != null) {
    shippingOptions.push({
      icon: "🏠",
      label: "Home Delivery inside Valley",
      amount: homeDelivery,
      description: homeDeliveryDesc || null
    });
  }

  if (outsideValley != null) {
    shippingOptions.push({
      icon: "📦",
      label: "Outside Valley",
      amount: outsideValley,
      description: outsideValleyDesc || null
    });
  }

  const hasShipping = shippingOptions.length > 0;

  return (
    <section className={styles.shippingSection}>
      <h3 className={styles.title}>Shipping</h3>
      <div className={styles.shippingContent}>
        {hasShipping ? (
          <ul className={styles.chargeList}>
            {shippingOptions.map((option, idx) => (
              <li key={idx} className={styles.chargeItem}>
                <span className={styles.emoji}>{option.icon}</span>
                <span className={styles.chargeLabel}>{option.label}: Rs.</span>
                <span className={styles.chargePrice}>{option.amount}</span>
                {option.description && (
                  <span className={styles.chargeDesc}>— {option.description}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noData}>No shipping information available.</p>
        )}
      </div>
    </section>
  );
}

