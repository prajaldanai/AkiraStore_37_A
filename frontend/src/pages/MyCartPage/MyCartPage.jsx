import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import useCartAction from "../../components/Product/product-actions/useCartAction";
import { createBuyNowSession } from "../../services/buyNowService";
import styles from "./MyCartPage.module.css";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/200x200?text=No+Image";
const PREVIEW_STORAGE_KEY = "akira_store_selected_preview";

export default function MyCartPage() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateCartItemQuantity } = useCartAction();
  const [buying, setBuying] = useState(false);
  const [pageMessage, setPageMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const availableIds = new Set(cartItems.map((item) => item.id));
      return prev.filter((id) => availableIds.has(id));
    });
  }, [cartItems]);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [cartItems]
  );

  const totalValue = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0
      ),
    [cartItems]
  );

  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedIds.includes(item.id)),
    [cartItems, selectedIds]
  );

  const selectedTotal = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0
      ),
    [selectedItems]
  );

  const selectedCount = selectedItems.length;
  const allSelected = cartItems.length > 0 && selectedCount === cartItems.length;

  const helperText = selectedCount
    ? `You're ready to buy ${selectedCount} item${selectedCount > 1 ? "s" : ""}.`
    : "Select items you'd like to purchase.";

  const handleSelectAll = (value) => {
    if (value) {
      setSelectedIds(cartItems.map((item) => item.id));
      return;
    }
    setSelectedIds([]);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleBuyNow = async () => {
    if (!selectedCount) {
      setPageMessage("Add some products to your cart before checking out.");
      return;
    }

    const target = selectedItems[0];
    if (!target) {
      setPageMessage("Cart item could not be found.");
      return;
    }

    setBuying(true);
    setPageMessage("");

    try {
    localStorage.setItem(
      PREVIEW_STORAGE_KEY,
      JSON.stringify(
        selectedItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
          image: item.image,
        }))
      )
    );

    const result = await createBuyNowSession({
        productId: target.id,
        quantity: Number(target.quantity) || 1,
        selectedSize: target.selectedSizes?.length
          ? target.selectedSizes.join(",")
          : undefined,
      });

      if (result.success && result.sessionId) {
        navigate(`/buy-now/${result.sessionId}`);
        return;
      }

      setPageMessage(result.message || "Failed to start checkout.");
    } catch (error) {
      setPageMessage(error.message || "Failed to start checkout.");
    } finally {
      setBuying(false);
    }
  };

  const showProductDetails = (productId) => {
    if (!productId) return;
    navigate(`/product/${productId}`);
  };

  return (
    <Layout>
      <div className={styles.page}>
        <section className={styles.hero}>
          <h1>MY CART</h1>
          <p>Number of Items</p>
        </section>

        {cartItems.length > 0 && (
          <div className={styles.totalSummary}>
            <span>Total items: {totalItems}</span>
            <strong>Rs. {totalValue.toLocaleString()}</strong>
          </div>
        )}

        <div className={styles.summaryBar}>
          <label className={styles.selectAll}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => handleSelectAll(event.target.checked)}
            />
            <span>Select all</span>
          </label>
          <div className={styles.selectionInfo}>
            <p>
              Selected {selectedCount} / {cartItems.length} item{cartItems.length === 1 ? "" : "s"}
            </p>
            <p className={styles.selectionTotal}>Rs. {selectedTotal.toLocaleString()}</p>
          </div>
        </div>

        <p className={styles.helperText}>{helperText}</p>

        {pageMessage && <div className={styles.pageMessage}>{pageMessage}</div>}

        <section className={styles.cartList}>
          {cartItems.length === 0 ? (
            <div className={styles.emptyState}>
              <h2>Your cart is empty</h2>
              <p>Browse curated picks to fill it up.</p>
            </div>
          ) : (
            cartItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div key={item.id} className={styles.cartItem}>
                  <label className={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </label>
                  <div className={styles.itemImageWrapper}>
                    <img
                      src={item.image || PLACEHOLDER_IMAGE}
                      alt={item.name}
                      onError={(event) => (event.target.src = PLACEHOLDER_IMAGE)}
                      role="button"
                      tabIndex={0}
                      onClick={() => showProductDetails(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          showProductDetails(item.id);
                        }
                      }}
                    />
                  </div>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemPrice}>
                    Rs. {Number(item.price).toLocaleString()}
                  </div>
                  <div className={styles.quantityControl}>
                    <button
                      type="button"
                      onClick={() => updateCartItemQuantity(item.id, 1)}
                      className={styles.quantityButton}
                    >
                      +
                    </button>
                    <span className={styles.quantityValue}>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartItemQuantity(item.id, -1)}
                      className={styles.quantityButton}
                    >
                      -
                    </button>
                  </div>
                  <button
                    type="button"
                    className={styles.trashButton}
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.name}`}
                  >
                    🗑
                  </button>
                </div>
              );
            })
          )}
        </section>

        {selectedCount > 0 && (
          <section className={styles.previewSection}>
            <h2 className={styles.previewTitle}>Selected items</h2>
            <div className={styles.previewGrid}>
              {selectedItems.map((item) => (
                <div key={`preview-${item.id}`} className={styles.previewCard}>
                  <img
                    src={item.image || PLACEHOLDER_IMAGE}
                    alt={item.name}
                    className={styles.previewImage}
                    onError={(event) => (event.target.src = PLACEHOLDER_IMAGE)}
                  />
                  <div>
                    <p className={styles.previewName}>{item.name}</p>
                    <p className={styles.previewQty}>Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}


        <div className={styles.buyNowRow}>
          <button
            type="button"
            className={styles.buyNowButton}
            onClick={handleBuyNow}
            disabled={buying || selectedCount === 0}
          >
            {buying ? "Preparing checkout..." : "BUY NOW"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
