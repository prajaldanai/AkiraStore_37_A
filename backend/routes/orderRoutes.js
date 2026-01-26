const express = require("express");
const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getUserOrderById,
  confirmOrder,
  getMyOrders,
  getMyOrderById,
} = require("../controllers/orderController");

const { optionalAuth, verifyToken, isAdmin } = require("../middlewares/authMiddleware");
const { enforceUserStatus } = require("../middlewares/enforceUserStatus");

// Create a new order (requires authentication)
// POST /api/orders
// Apply enforceUserStatus to prevent blocked/suspended users from ordering
router.post("/", verifyToken, enforceUserStatus, createOrder);

// ===================== USER MY ORDERS ROUTES =====================
// IMPORTANT: These must come BEFORE /:orderId to avoid route conflicts

// Get logged-in user's orders only
// GET /api/orders/my
router.get("/my", verifyToken, getMyOrders);

// Get logged-in user's specific order (only if they own it)
// GET /api/orders/my/:orderId
router.get("/my/:orderId", verifyToken, getMyOrderById);

// ===================== ORDER ROUTES =====================

// Get order by ID for confirmation page (user)
// GET /api/orders/:orderId
router.get("/:orderId", optionalAuth, getUserOrderById);

// Confirm order (user finalizes the order - requires authentication)
// POST /api/orders/:orderId/confirm
// Apply enforceUserStatus to prevent blocked/suspended users from confirming orders
router.post("/:orderId/confirm", verifyToken, enforceUserStatus, confirmOrder);

// ===================== ADMIN ROUTES =====================

// Get all orders (admin only)
// GET /api/admin/orders
router.get("/admin", verifyToken, isAdmin, getAllOrders);

// Get single order by ID (admin only)
// GET /api/admin/orders/:orderId
router.get("/admin/:orderId", verifyToken, isAdmin, getOrderById);

// Update order status (admin only)
// PUT /api/admin/orders/:orderId/status
router.put("/admin/:orderId/status", verifyToken, isAdmin, updateOrderStatus);

module.exports = router;
