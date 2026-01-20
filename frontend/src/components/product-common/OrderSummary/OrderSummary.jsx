import React from "react";
import styles from "./OrderSummary.module.css";

export default function OrderSummary({
  unitPrice = 0,
  quantity = 1,
  shippingAmount = 0,
  bargainDiscount = 0,
  giftBoxFee = 0,
  giftBoxSelected = false,
  currencyLabel = "Rs.",
  onToggleGiftBox,
  onOpenBargain,
}) {
  const safeUnitPrice = Number(unitPrice) || 0;
  const safeQuantity = Number(quantity) || 1;
  const safeShippingAmount = Number(shippingAmount) || 0;
  const safeBargainDiscount = Number(bargainDiscount) || 0;
  const safeGiftBoxFee = Number(giftBoxFee) || 0;

  const subtotal = safeUnitPrice * safeQuantity;
  const giftBoxTotal = giftBoxSelected ? safeGiftBoxFee : 0;
  const total = subtotal + safeShippingAmount + giftBoxTotal - safeBargainDiscount;

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Order Summary</h3>
        {onOpenBargain && (
          <button type="button" className={styles.bargainButton} onClick={onOpenBargain}>
            Start Bargain
          </button>
        )}
      </div>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span>Price</span>
          <span>{currencyLabel} {subtotal.toLocaleString()}</span>
        </div>
        <div className={styles.row}>
          <span>Shipping</span>
          <span>{currencyLabel} {safeShippingAmount.toLocaleString()}</span>
        </div>
        <div className={styles.row}>
          <span>Gift box</span>
          <span>{currencyLabel} {giftBoxTotal.toLocaleString()}</span>
        </div>
        <div className={styles.row}>
          <span>Bargain</span>
          <span>- {currencyLabel} {safeBargainDiscount.toLocaleString()}</span>
        </div>
      </div>

      <label className={styles.giftBoxToggle}>
        <input
          type="checkbox"
          checked={giftBoxSelected}
          onChange={(e) => onToggleGiftBox && onToggleGiftBox(e.target.checked)}
        />
        Add gift box ({currencyLabel} {safeGiftBoxFee.toLocaleString()})
      </label>

      <div className={styles.totalRow}>
        <span>Total</span>
        <span>{currencyLabel} {total.toLocaleString()}</span>
      </div>
    </section>
  );
}
