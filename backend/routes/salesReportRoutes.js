/**
 * Sales Report Routes
 * Admin-only routes for sales analytics
 */

const express = require("express");
const router = express.Router();

const {
  getSalesReport,
  getCategories,
  getKPIs,
  getSalesTrend,
} = require("../controllers/salesReportController");

const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

// All routes require admin authentication
router.use(verifyToken);
router.use(isAdmin);

/* ============================================================
   SALES REPORT ROUTES
============================================================ */

// Get categories for filter dropdown
// GET /api/admin/sales-report/categories
router.get("/categories", getCategories);

// Get KPIs only (quick refresh)
// GET /api/admin/sales-report/kpis
router.get("/kpis", getKPIs);

// Get sales trend only
// GET /api/admin/sales-report/trend
router.get("/trend", getSalesTrend);

// Get full sales report
// GET /api/admin/sales-report?fromDate=&toDate=&categoryId=
router.get("/", getSalesReport);

module.exports = router;
