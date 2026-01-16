import React, { useMemo } from "react";
import styles from "./BuyNow.module.css";

export default function BuyNow({
  productId,
  productName = "",
  unitPrice = 0,
  quantity = 1,
  selectedSizes = [],
  shippingOption = null,
  giftBox = false,
  bargainDiscount = 0,
  total,
  disabled = false,
  onBuyNow,
}) {
  const safeUnitPrice = Number(unitPrice) || 0;
  const safeQuantity = Number(quantity) || 1;
  const safeBargainDiscount = Number(bargainDiscount) || 0;
  const giftBoxFee = giftBox ? Number(shippingOption?.giftBoxFee || 0) : 0;

  const computedTotal = useMemo(() => {
    if (typeof total === "number") return total;
    const shippingAmount = Number(shippingOption?.amount) || 0;
    return safeUnitPrice * safeQuantity + shippingAmount + giftBoxFee - safeBargainDiscount;
  }, [total, safeUnitPrice, safeQuantity, shippingOption, giftBoxFee, safeBargainDiscount]);

  const handleBuyNow = () => {
    if (!onBuyNow) return;
    onBuyNow({
      productId,
      productName,
      unitPrice: safeUnitPrice,
      quantity: safeQuantity,
      selectedSizes,
      shippingOption,
      giftBox,
      bargainDiscount: safeBargainDiscount,
      total: computedTotal,
    });
  };

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Buy Now</h3>
        <p className={styles.subtitle}>Ready to checkout with your current selections.</p>
      </div>

      <div className={styles.details}>
        <div className={styles.row}>
          <span className={styles.label}>Product</span>
          <span className={styles.value}>{productName || "Unnamed product"}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Quantity</span>
          <span className={styles.value}>{safeQuantity}</span>
        </div>
        {selectedSizes.length > 0 && (
          <div className={styles.row}>
            <span className={styles.label}>Sizes</span>
            <span className={styles.value}>{selectedSizes.join(", ")}</span>
          </div>
        )}
        {shippingOption && (
          <div className={styles.row}>
            <span className={styles.label}>Shipping</span>
            <span className={styles.value}>
              {shippingOption.label} (Rs. {Number(shippingOption.amount) || 0})
            </span>
          </div>
        )}
        {giftBox && (
          <div className={styles.row}>
            <span className={styles.label}>Gift box</span>
            <span className={styles.value}>Included</span>
          </div>
        )}
        {safeBargainDiscount > 0 && (
          <div className={styles.row}>
            <span className={styles.label}>Bargain</span>
            <span className={styles.value}>- Rs. {safeBargainDiscount}</span>
          </div>
        )}
      </div>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Total</span>
        <span className={styles.totalValue}>Rs. {computedTotal.toLocaleString()}</span>
      </div>

      <button
        type="button"
        className={styles.buyButton}
        onClick={handleBuyNow}
        disabled={disabled}
      >
        Buy Now
      </button>
    </section>
  );
}
