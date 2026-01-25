/**
 * Admin Dashboard Controller
 * Handles dashboard API endpoints
 */

const dashboardService = require("../services/dashboard/dashboardService");

/* ============================================================
   GET FULL DASHBOARD DATA
   GET /api/admin/dashboard
============================================================ */
exports.getDashboard = async (req, res) => {
  try {
    const { days } = req.query;
    const salesDays = parseInt(days) || 7;
    
    const dashboard = await dashboardService.getFullDashboard(salesDays);
    
    return res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error("getDashboard ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    });
  }
};

/* ============================================================
   GET KPIs ONLY (for quick refresh)
   GET /api/admin/dashboard/kpis
============================================================ */
exports.getKPIs = async (req, res) => {
  try {
    const kpis = await dashboardService.getDashboardKPIs();
    
    return res.json({
      success: true,
      data: kpis,
    });
  } catch (error) {
    console.error("getKPIs ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load KPIs",
    });
  }
};

/* ============================================================
   GET SALES OVERVIEW
   GET /api/admin/dashboard/sales?days=7
============================================================ */
exports.getSalesOverview = async (req, res) => {
  try {
    const { days } = req.query;
    const salesDays = parseInt(days) || 7;
    
    const sales = await dashboardService.getSalesOverview(salesDays);
    
    return res.json({
      success: true,
      data: sales,
    });
  } catch (error) {
    console.error("getSalesOverview ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load sales overview",
    });
  }
};

/* ============================================================
   GET RECENT ORDERS
   GET /api/admin/dashboard/recent-orders
============================================================ */
exports.getRecentOrders = async (req, res) => {
  try {
    const { limit } = req.query;
    const orderLimit = parseInt(limit) || 10;
    
    const orders = await dashboardService.getRecentOrders(orderLimit);
    
    return res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("getRecentOrders ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load recent orders",
    });
  }
};

/* ============================================================
   GET ADMIN NOTIFICATIONS
   GET /api/admin/dashboard/notifications
   Returns real-time notifications for admin (new orders, low stock, etc.)
============================================================ */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await dashboardService.getAdminNotifications();
    
    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("getNotifications ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load notifications",
    });
  }
};

/* ============================================================
   ADMIN GLOBAL SEARCH
   GET /api/admin/dashboard/search?q=query
   Search across products, orders, and users
============================================================ */
exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: { products: [], orders: [], users: [] },
      });
    }
    
    const results = await dashboardService.globalSearch(q.trim());
    
    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("globalSearch ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
};
