/**
 * Admin Dashboard Routes
 * Provides dashboard data endpoints
 */

const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

// All dashboard routes require admin authentication
router.use(verifyToken, isAdmin);

// GET /api/admin/dashboard - Full dashboard data
router.get("/", dashboardController.getDashboard);

// GET /api/admin/dashboard/kpis - KPIs only
router.get("/kpis", dashboardController.getKPIs);

// GET /api/admin/dashboard/sales - Sales overview
router.get("/sales", dashboardController.getSalesOverview);

// GET /api/admin/dashboard/recent-orders - Recent orders
router.get("/recent-orders", dashboardController.getRecentOrders);

// GET /api/admin/dashboard/notifications - Admin notifications
router.get("/notifications", dashboardController.getNotifications);

// GET /api/admin/dashboard/search - Global search
router.get("/search", dashboardController.globalSearch);

module.exports = router;
