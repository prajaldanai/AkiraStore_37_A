/**
 * Sales Report Controller
 * Handles admin sales report API endpoints
 */

const salesReportService = require("../services/reports/salesReportService");
const { Category } = require("../models");

/* ============================================================
   GET FULL SALES REPORT
   GET /api/admin/sales-report
   Query params: fromDate, toDate, categoryId
============================================================ */
exports.getSalesReport = async (req, res) => {
  try {
    const { fromDate, toDate, categoryId } = req.query;
    
    // Validate dates if provided
    if (fromDate && isNaN(Date.parse(fromDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid fromDate format",
      });
    }
    
    if (toDate && isNaN(Date.parse(toDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid toDate format",
      });
    }
    
    const report = await salesReportService.getFullSalesReport({
      fromDate,
      toDate,
      categoryId: categoryId ? parseInt(categoryId) : null,
    });
    
    return res.json({
      success: true,
      data: report,
    });
    
  } catch (error) {
    console.error("getSalesReport ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate sales report",
    });
  }
};

/* ============================================================
   GET CATEGORIES FOR FILTER
   GET /api/admin/sales-report/categories
============================================================ */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ["id", "name", "slug"],
      order: [["name", "ASC"]],
    });
    
    return res.json({
      success: true,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
    });
    
  } catch (error) {
    console.error("getCategories ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

/* ============================================================
   GET KPIs ONLY (for quick refresh)
   GET /api/admin/sales-report/kpis
============================================================ */
exports.getKPIs = async (req, res) => {
  try {
    const { fromDate, toDate, categoryId } = req.query;
    
    const kpis = await salesReportService.getKPIs(
      fromDate,
      toDate,
      categoryId ? parseInt(categoryId) : null
    );
    
    return res.json({
      success: true,
      data: kpis,
    });
    
  } catch (error) {
    console.error("getKPIs ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch KPIs",
    });
  }
};

/* ============================================================
   GET SALES TREND ONLY
   GET /api/admin/sales-report/trend
============================================================ */
exports.getSalesTrend = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    const trend = await salesReportService.getSalesTrend(fromDate, toDate);
    
    return res.json({
      success: true,
      data: trend,
    });
    
  } catch (error) {
    console.error("getSalesTrend ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales trend",
    });
  }
};

module.exports = exports;
