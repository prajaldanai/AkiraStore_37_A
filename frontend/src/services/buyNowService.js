/**
 * Buy Now Service
 * Handles all API calls for Buy Now checkout flow
 */

const API_BASE = "http://localhost:5000/api";

/**
 * Get auth token from localStorage
 */
function getAuthToken() {
  return localStorage.getItem("authToken");
}

/**
 * Get auth headers
 */
function getHeaders(includeAuth = true) {
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

/* ============================================================
   BUY NOW SESSION ENDPOINTS
============================================================ */

/**
 * Create a new Buy Now session
 * @param {Object} data - { productId, selectedSize, quantity }
 * @returns {Promise<Object>} - { success, sessionId, session }
 */
export async function createBuyNowSession(data) {
  try {
    const response = await fetch(`${API_BASE}/buy-now/session`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to create session");
    }
    
    return result;
  } catch (error) {
    console.error("createBuyNowSession error:", error);
    throw error;
  }
}

/**
 * Get a Buy Now session by ID
 * @param {string} sessionId
 * @returns {Promise<Object>} - { success, session }
 */
export async function getBuyNowSession(sessionId) {
  try {
    const response = await fetch(`${API_BASE}/buy-now/session/${sessionId}`, {
      method: "GET",
      headers: getHeaders(false),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to get session");
    }
    
    return result;
  } catch (error) {
    console.error("getBuyNowSession error:", error);
    throw error;
  }
}

/**
 * Update a Buy Now session
 * @param {string} sessionId
 * @param {Object} data - { selectedSize, quantity }
 * @returns {Promise<Object>}
 */
export async function updateBuyNowSession(sessionId, data) {
  try {
    const response = await fetch(`${API_BASE}/buy-now/session/${sessionId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to update session");
    }
    
    return result;
  } catch (error) {
    console.error("updateBuyNowSession error:", error);
    throw error;
  }
}

/* ============================================================
   ORDER ENDPOINTS
============================================================ */

/**
 * Create a new order
 * @param {Object} orderData
 * @returns {Promise<Object>}
 */
export async function createOrder(orderData) {
  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to create order");
    }
    
    return result;
  } catch (error) {
    console.error("createOrder error:", error);
    throw error;
  }
}

/**
 * Get order by ID (for confirmation page)
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export async function getOrderById(orderId) {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to get order");
    }
    
    return result;
  } catch (error) {
    console.error("getOrderById error:", error);
    throw error;
  }
}

/**
 * Confirm an order (finalize after review)
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export async function confirmOrder(orderId) {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}/confirm`, {
      method: "POST",
      headers: getHeaders(),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to confirm order");
    }
    
    return result;
  } catch (error) {
    console.error("confirmOrder error:", error);
    throw error;
  }
}

/* ============================================================
   MY ORDERS ENDPOINTS
============================================================ */

/**
 * Get logged-in user's orders
 * @param {Object} options - { status, page, limit }
 * @returns {Promise<Object>}
 */
export async function getMyOrders(options = {}) {
  try {
    const { status, page = 1, limit = 20 } = options;
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("page", page);
    params.append("limit", limit);

    const response = await fetch(`${API_BASE}/orders/my?${params.toString()}`, {
      method: "GET",
      headers: getHeaders(),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch orders");
    }
    
    return result;
  } catch (error) {
    console.error("getMyOrders error:", error);
    throw error;
  }
}

/**
 * Get user's specific order by ID (only if they own it)
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export async function getMyOrderById(orderId) {
  try {
    const response = await fetch(`${API_BASE}/orders/my/${orderId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch order");
    }
    
    return result;
  } catch (error) {
    console.error("getMyOrderById error:", error);
    throw error;
  }
}

/* ============================================================
   BARGAIN LOGIC (CLIENT-SIDE)
   Stepped discount: 5% -> 8% -> 10% (hidden from user)
   Owner counters progressively, never reveals max upfront
============================================================ */

/**
 * Get the owner's counter offer based on attempt number
 * - Attempt 1: 5% discount
 * - Attempt 2: 8% discount  
 * - Attempt 3: 10% discount (final)
 */
function getOwnerCounterByAttempt(subtotal, attemptCount) {
  const discountSteps = {
    1: 0.05, // 5%
    2: 0.08, // 8%
    3: 0.10, // 10% (final)
  };
  const discountPercent = discountSteps[Math.min(attemptCount, 3)] || 0.05;
  const counterPrice = subtotal * (1 - discountPercent);
  return Math.round(counterPrice * 100) / 100;
}

/**
 * Calculate bargain response (realistic negotiation)
 * @param {number} subtotal - unitPrice * quantity
 * @param {number} offerPrice - Customer's offer
 * @param {number} attemptCount - Current attempt number (1-3)
 * @returns {Object} - { accepted, discount, counterOffer, message, isFinal }
 */
export function calculateBargainResponse(subtotal, offerPrice, attemptCount) {
  // Get the current counter offer for this attempt
  const currentCounter = getOwnerCounterByAttempt(subtotal, attemptCount);
  const maxDiscountPrice = subtotal * 0.90; // 10% max discount (hidden)

  // Validate offer
  if (typeof offerPrice !== "number" || isNaN(offerPrice) || offerPrice <= 0) {
    return {
      accepted: false,
      discount: 0,
      counterOffer: null,
      message: "Please enter a valid price.",
      isFinal: false,
    };
  }

  // Offer too high (more than original price) - accept immediately
  if (offerPrice >= subtotal) {
    return {
      accepted: true,
      discount: 0,
      counterOffer: null,
      message: "Deal! ✅ We accept your offer.",
      isFinal: true,
    };
  }

  // Customer offer is >= owner's current counter - ACCEPT the customer's offer
  // This is realistic: if customer offers more than owner's counter, owner accepts
  if (offerPrice >= currentCounter) {
    const discount = subtotal - offerPrice;
    return {
      accepted: true,
      discount: Math.round(discount * 100) / 100,
      counterOffer: null,
      message: `Deal! ✅ We accept Rs. ${Math.round(offerPrice).toLocaleString()}. You saved Rs. ${Math.round(discount).toLocaleString()}!`,
      isFinal: true,
    };
  }

  // Customer offer is too low - counter with stepped discount
  const isLastAttempt = attemptCount >= 3;
  
  if (isLastAttempt) {
    // Final offer from owner (10% discount)
    return {
      accepted: false,
      discount: 0,
      counterOffer: maxDiscountPrice,
      message: `Hmm, that's quite low 😅 My final offer is Rs. ${Math.round(maxDiscountPrice).toLocaleString()}. This is the best I can do!`,
      isFinal: true,
      canAcceptCounter: true,
    };
  }

  // Counter based on attempt (5% first, 8% second)
  const counterMessages = {
    1: `That's a bit low 🤔 How about Rs. ${Math.round(currentCounter).toLocaleString()}?`,
    2: `I really want to make this work! Rs. ${Math.round(currentCounter).toLocaleString()} is my best so far.`,
  };

  return {
    accepted: false,
    discount: 0,
    counterOffer: currentCounter,
    message: counterMessages[attemptCount] || `How about Rs. ${Math.round(currentCounter).toLocaleString()}?`,
    isFinal: false,
    canAcceptCounter: true,
    attemptsRemaining: 3 - attemptCount,
  };
}

/**
 * Accept a counter offer
 * @param {number} subtotal
 * @param {number} counterOffer
 * @returns {Object}
 */
export function acceptCounterOffer(subtotal, counterOffer) {
  const discount = subtotal - counterOffer;
  return {
    accepted: true,
    discount: Math.round(discount * 100) / 100,
    finalPrice: counterOffer,
    message: `Deal! ✅ You saved Rs. ${Math.round(discount).toLocaleString()}`,
  };
}

export default {
  createBuyNowSession,
  getBuyNowSession,
  updateBuyNowSession,
  createOrder,
  calculateBargainResponse,
  acceptCounterOffer,
};
