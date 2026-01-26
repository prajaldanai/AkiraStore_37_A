import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "akira_store_cart";
export const CART_UPDATE_EVENT = "akira_store_cart_updated";
const IMAGE_BASE_URL = "http://localhost:5000";

const safeWindow = typeof window !== "undefined" ? window : null;

function readCartFromStorage() {
  if (!safeWindow) return [];
  const raw = safeWindow.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("useCartAction › readCartFromStorage error:", error);
    return [];
  }
}

function resolveImageUrl(src) {
  if (!src) return "";
  const normalized = String(src).trim();
  if (!normalized) return "";
  if (normalized.startsWith("http")) return normalized;
  if (normalized.startsWith("/")) {
    return `${IMAGE_BASE_URL}${normalized}`;
  }
  return normalized;
}

function normalizeSizes(input) {
  if (input === undefined || input === null) return [];
  if (Array.isArray(input)) {
    return input.filter(Boolean);
  }
  const normalized = String(input).trim();
  if (!normalized) return [];
  return normalized.split(",").map((item) => item.trim()).filter(Boolean);
}

function extractProductId(product = {}, options = {}) {
  const candidate =
    options.id ??
    product?.id ??
    product?._id ??
    product?.product_id ??
    product?.productId ??
    product?.slug ??
    product?.sku ??
    null;
  if (candidate === null || candidate === undefined) return null;
  return String(candidate);
}

function buildCartItem(product = {}, overrides = {}) {
  const name =
    overrides.name ??
    product?.name ??
    product?.productName ??
    product?.title ??
    "Product";
  const priceValue =
    Number(overrides.price ?? product?.price ?? product?.unit_price ?? product?.unitPrice ?? 0) || 0;
  const image =
    resolveImageUrl(
      overrides.image ??
        product?.main_image ??
        product?.image ??
        product?.product_image ??
        product?.image_url
    ) || "";
  const selectedSizes = normalizeSizes(
    overrides.selectedSizes ??
      overrides.selectedSize ??
      product?.selectedSizes ??
      product?.selectedSize ??
      product?.size ??
      product?.sizes
  );

  return {
    id: extractProductId(product, overrides),
    name,
    price: priceValue,
    image,
    selectedSizes,
  };
}

function dispatchCartEvent(items = []) {
  if (!safeWindow) return;
  const payload = { detail: { items } };
  const event =
    typeof safeWindow.CustomEvent === "function"
      ? new safeWindow.CustomEvent(CART_UPDATE_EVENT, payload)
      : new Event(CART_UPDATE_EVENT);
  safeWindow.dispatchEvent(event);
}

function persistCart(items) {
  if (!safeWindow) return;
  try {
    safeWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("useCartAction › persistCart error:", error);
  }
  dispatchCartEvent(items);
}

export function getCartSnapshot() {
  return readCartFromStorage();
}

export default function useCartAction() {
  const [cartItems, setCartItems] = useState(() => readCartFromStorage());
  const [message, setMessage] = useState(null);
  const messageTimer = useRef(null);

  const clearMessage = useCallback(() => {
    setMessage(null);
    if (messageTimer.current) {
      clearTimeout(messageTimer.current);
      messageTimer.current = null;
    }
  }, []);

  const queueMessage = useCallback(
    (payload) => {
      if (!payload || !payload.text) return;
      clearMessage();
      setMessage({ text: payload.text, type: payload.type || "info", id: Date.now() });
      if (payload.duration !== 0) {
        const duration = typeof payload.duration === "number" ? payload.duration : 2800;
        messageTimer.current = safeWindow
          ? safeWindow.setTimeout(() => {
              setMessage(null);
              messageTimer.current = null;
            }, duration)
          : null;
      }
    },
    [clearMessage]
  );

  useEffect(() => {
    if (!safeWindow) return undefined;
    const handleStorageEvent = () => {
      setCartItems(readCartFromStorage());
    };
    safeWindow.addEventListener(CART_UPDATE_EVENT, handleStorageEvent);
    return () => {
      safeWindow.removeEventListener(CART_UPDATE_EVENT, handleStorageEvent);
      clearMessage();
    };
  }, [clearMessage]);

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + (Number(item.quantity) || 0), 0),
    [cartItems]
  );

  const addToCart = useCallback(
    (product, options = {}) => {
      const cartId = extractProductId(product, options);
      if (!cartId) {
        queueMessage({
          text: "Cannot add unknown product to cart.",
          type: "info",
        });
        return;
      }

      const quantityToAdd = Math.max(1, Number(options.quantity) || 1);
      const preparedItem = buildCartItem(
        { ...product, id: cartId },
        { ...options, id: cartId }
      );

      // Read current cart directly from storage to avoid stale state
      const currentCart = readCartFromStorage();
      const existing = currentCart.find((entry) => entry.id === cartId);
      
      let updatedCart;
      let messagePayload;

      if (existing) {
        const newQty = Math.max(1, Number(existing.quantity) || 0) + quantityToAdd;
        updatedCart = currentCart.map((entry) =>
          entry.id === cartId
            ? {
                ...entry,
                quantity: newQty,
                selectedSizes: preparedItem.selectedSizes,
                updatedAt: new Date().toISOString(),
              }
            : entry
        );
        messagePayload = {
          text: `${preparedItem.name} already in your cart. Quantity updated to ${newQty}.`,
          type: "info",
        };
      } else {
        updatedCart = [
          ...currentCart,
          {
            ...preparedItem,
            quantity: quantityToAdd,
            addedAt: new Date().toISOString(),
          },
        ];
        messagePayload = {
          text: `${preparedItem.name} added to cart`,
          type: "success",
        };
      }

      // Persist to storage first, then update state
      persistCart(updatedCart);
      setCartItems(updatedCart);
      queueMessage(messagePayload);
    },
    [queueMessage]
  );

  const removeFromCart = useCallback(
    (productId) => {
      if (!productId) return;
      const currentItems = readCartFromStorage();
      const next = currentItems.filter((entry) => entry.id !== productId);
      if (next.length === currentItems.length) {
        return;
      }
      persistCart(next);
      setCartItems(next);
      const removedName = currentItems.find((entry) => entry.id === productId)?.name;
      queueMessage({
        text: removedName ? `${removedName} removed from cart` : "Item removed",
        type: "info",
      });
    },
    [queueMessage]
  );

  const updateCartItemQuantity = useCallback(
    (productId, delta) => {
      if (!productId || typeof delta !== "number" || delta === 0) return;
      let updatedCart = [];
      let updatedName = "";
      let updatedQuantity = null;
      let hadChanges = false;

      setCartItems((prev) => {
        const next = [];
        prev.forEach((entry) => {
          if (entry.id === productId) {
            const currentQty = Number(entry.quantity) || 0;
            const nextQty = Math.max(currentQty + delta, 1);
            if (nextQty === currentQty) {
              next.push(entry);
              return;
            }
            hadChanges = true;
            updatedName = entry.name;
            updatedQuantity = nextQty;
            next.push({
              ...entry,
              quantity: nextQty,
              updatedAt: new Date().toISOString(),
            });
            return;
          }
          next.push(entry);
        });
        updatedCart = next;
        return next;
      });

      if (!hadChanges) {
        return;
      }

      persistCart(updatedCart);

      queueMessage({
        text: `${updatedName} quantity now ${updatedQuantity}`,
        type: "info",
      });
    },
    [queueMessage]
  );

  useEffect(() => {
    return () => {
      clearMessage();
    };
  }, [clearMessage]);

  return {
    cartItems,
    cartCount,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    message,
    clearMessage,
  };
}
