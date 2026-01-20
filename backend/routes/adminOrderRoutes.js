const express = require("express");
const router = express.Router();

const {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  getOrderStats,
} = require("../controllers/adminOrderController");

const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

// All routes require admin authentication
router.use(verifyToken);
router.use(isAdmin);

/* ============================================================
   ADMIN ORDER ROUTES
============================================================ */

// Get order statistics for dashboard
// GET /api/admin/orders/stats
router.get("/stats", getOrderStats);

// Get all orders (with scope filter: active or history)
// GET /api/admin/orders?scope=active|history&search=&status=&page=1&limit=20
router.get("/", getAdminOrders);

// Get single order by ID
// GET /api/admin/orders/:orderId
router.get("/:orderId", getAdminOrderById);

// Update order status
// PATCH /api/admin/orders/:orderId/status
router.patch("/:orderId/status", updateOrderStatus);

module.exports = router;
