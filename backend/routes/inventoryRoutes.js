/**
 * Inventory Routes
 * Admin-only routes for inventory management
 */

const express = require("express");
const router = express.Router();

const {
  getInventory,
  adjustStock,
  getCategories,
  getProductStock,
} = require("../controllers/inventoryController");

const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

// All routes require admin authentication
router.use(verifyToken);
router.use(isAdmin);

/* ============================================================
   INVENTORY ROUTES
============================================================ */

// Get categories for filter dropdown
// GET /api/admin/inventory/categories
router.get("/categories", getCategories);

// Get inventory list with filters
// GET /api/admin/inventory?category=&stockStatus=&search=&page=1&limit=20
router.get("/", getInventory);

// Get single product stock info
// GET /api/admin/inventory/:productId
router.get("/:productId", getProductStock);

// Adjust stock (+/- delta)
// PATCH /api/admin/inventory/:productId/adjust
// Body: { delta: +1 or -1 }
router.patch("/:productId/adjust", adjustStock);

module.exports = router;
