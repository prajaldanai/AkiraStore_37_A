/**
 * Admin Dashboard Service
 * Provides aggregated data for the admin dashboard
 * Revenue = Delivered orders only
 */

const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("../../database/sequelize");
const { Order, OrderItem, Product, Category, ProductImage, User } = require("../../models");

// Status constants
const DELIVERED_STATUSES = ["DELIVERED", "delivered"];
const CANCELLED_STATUSES = ["CANCELLED", "cancelled"];
const PROCESSING_STATUSES = ["PROCESSING", "processing", "PLACED", "placed", "SHIPPED", "shipped"];

// Low stock threshold
const LOW_STOCK_THRESHOLD = 5;

/* ============================================================
   GET DASHBOARD KPIs
============================================================ */
async function getDashboardKPIs() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Total revenue (delivered only)
  const totalRevenue = await Order.sum("total", {
    where: { status: { [Op.in]: DELIVERED_STATUSES } },
  }) || 0;

  // Delivered orders count
  const deliveredOrders = await Order.count({
    where: { status: { [Op.in]: DELIVERED_STATUSES } },
  });

  // Orders today
  const ordersToday = await Order.count({
    where: {
      created_at: { [Op.gte]: today, [Op.lt]: tomorrow },
    },
  });

  // Revenue today (delivered only)
  const revenueToday = await Order.sum("total", {
    where: {
      status: { [Op.in]: DELIVERED_STATUSES },
      created_at: { [Op.gte]: today, [Op.lt]: tomorrow },
    },
  }) || 0;

  // Low stock items
  const lowStockItems = await Product.count({
    where: { stock: { [Op.lte]: LOW_STOCK_THRESHOLD } },
  });

  // Total users
  const totalUsers = await User.count({
    where: { role: "user" },
  });

  // Cancelled orders
  const cancelledOrders = await Order.count({
    where: { status: { [Op.in]: CANCELLED_STATUSES } },
  });

  // Avg order value
  const avgOrderValue = deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0;

  // Pending orders
  const pendingOrders = await Order.count({
    where: { status: { [Op.in]: PROCESSING_STATUSES } },
  });

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    deliveredOrders,
    ordersToday,
    revenueToday: Math.round(revenueToday * 100) / 100,
    lowStockItems,
    totalUsers,
    cancelledOrders,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    pendingOrders,
  };
}

/* ============================================================
   GET SALES OVERVIEW (Last 7 or 30 days)
============================================================ */
async function getSalesOverview(days = 7) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  // Get daily aggregated sales for delivered orders
  const dailySales = await Order.findAll({
    where: {
      status: { [Op.in]: DELIVERED_STATUSES },
      created_at: { [Op.between]: [startDate, endDate] },
    },
    attributes: [
      [fn("DATE", col("created_at")), "date"],
      [fn("SUM", col("total")), "revenue"],
      [fn("COUNT", col("id")), "orders"],
    ],
    group: [fn("DATE", col("created_at"))],
    order: [[fn("DATE", col("created_at")), "ASC"]],
    raw: true,
  });

  // Fill in missing dates
  const salesMap = new Map();
  dailySales.forEach((row) => {
    const dateStr = new Date(row.date).toISOString().split("T")[0];
    salesMap.set(dateStr, {
      date: dateStr,
      revenue: parseFloat(row.revenue) || 0,
      orders: parseInt(row.orders) || 0,
    });
  });

  const trend = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    trend.push(salesMap.get(dateStr) || { date: dateStr, revenue: 0, orders: 0 });
    current.setDate(current.getDate() + 1);
  }

  // Calculate totals
  const totalRevenue = trend.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = trend.reduce((sum, d) => sum + d.orders, 0);

  return {
    trend,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    days,
  };
}

/* ============================================================
   GET ORDER STATUS BREAKDOWN
============================================================ */
async function getOrderStatusBreakdown() {
  const statuses = await Order.findAll({
    attributes: [
      "status",
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["status"],
    raw: true,
  });

  // Normalize statuses
  const breakdown = {
    delivered: 0,
    processing: 0,
    shipped: 0,
    placed: 0,
    cancelled: 0,
  };

  statuses.forEach((row) => {
    const status = (row.status || "").toLowerCase();
    const count = parseInt(row.count) || 0;
    
    if (DELIVERED_STATUSES.map(s => s.toLowerCase()).includes(status)) {
      breakdown.delivered += count;
    } else if (CANCELLED_STATUSES.map(s => s.toLowerCase()).includes(status)) {
      breakdown.cancelled += count;
    } else if (status === "shipped") {
      breakdown.shipped += count;
    } else if (status === "processing") {
      breakdown.processing += count;
    } else {
      breakdown.placed += count;
    }
  });

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return {
    breakdown: [
      { status: "Delivered", count: breakdown.delivered, color: "#10b981" },
      { status: "Shipped", count: breakdown.shipped, color: "#3b82f6" },
      { status: "Processing", count: breakdown.processing, color: "#f59e0b" },
      { status: "Placed", count: breakdown.placed, color: "#6366f1" },
      { status: "Cancelled", count: breakdown.cancelled, color: "#ef4444" },
    ].filter(s => s.count > 0),
    total,
  };
}

/* ============================================================
   GET LOW STOCK PRODUCTS
============================================================ */
async function getLowStockProducts(limit = 5) {
  const products = await Product.findAll({
    where: { stock: { [Op.lte]: LOW_STOCK_THRESHOLD } },
    attributes: ["id", "name", "stock", "price"],
    include: [
      {
        model: Category,
        attributes: ["name"],
      },
      {
        model: ProductImage,
        attributes: ["image_url"],
        limit: 1,
        order: [["id", "ASC"]],
      },
    ],
    order: [["stock", "ASC"]],
    limit,
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    stock: p.stock,
    price: parseFloat(p.price),
    category: p.Category?.name || "Uncategorized",
    image: p.ProductImages?.[0]?.image_url || null,
  }));
}

/* ============================================================
   GET TOP SELLING PRODUCTS
============================================================ */
async function getTopProducts(limit = 5) {
  // Aggregate sales from delivered orders
  const topProducts = await Order.findAll({
    where: { status: { [Op.in]: DELIVERED_STATUSES } },
    attributes: [
      "product_id",
      [fn("SUM", col("quantity")), "unitsSold"],
      [fn("SUM", col("total")), "revenue"],
    ],
    group: ["product_id"],
    order: [[fn("SUM", col("quantity")), "DESC"]],
    limit,
    raw: true,
  });

  // Get product details
  const productIds = topProducts.map((p) => p.product_id).filter(Boolean);
  
  if (productIds.length === 0) {
    return [];
  }

  const products = await Product.findAll({
    where: { id: { [Op.in]: productIds } },
    attributes: ["id", "name", "stock"],
    include: [
      { model: Category, attributes: ["name"] },
      { model: ProductImage, attributes: ["image_url"], limit: 1 },
    ],
  });

  const productMap = new Map();
  products.forEach((p) => productMap.set(p.id, p));

  return topProducts.map((tp) => {
    const product = productMap.get(tp.product_id);
    return {
      id: tp.product_id,
      name: product?.name || "Unknown Product",
      unitsSold: parseInt(tp.unitsSold) || 0,
      revenue: Math.round((parseFloat(tp.revenue) || 0) * 100) / 100,
      stock: product?.stock || 0,
      category: product?.Category?.name || "Uncategorized",
      image: product?.ProductImages?.[0]?.image_url || null,
    };
  });
}

/* ============================================================
   GET RECENT ORDERS
============================================================ */
async function getRecentOrders(limit = 10) {
  const orders = await Order.findAll({
    attributes: ["id", "customer_first_name", "customer_last_name", "customer_email", "product_name", "total", "status", "quantity", "created_at"],
    order: [["created_at", "DESC"]],
    limit,
  });

  return orders.map((o) => ({
    id: o.id,
    customerName: `${o.customer_first_name || ""} ${o.customer_last_name || ""}`.trim() || "Guest",
    customerEmail: o.customer_email,
    productName: o.product_name || "Unknown",
    quantity: o.quantity || 1,
    totalAmount: parseFloat(o.total) || 0,
    status: o.status,
    createdAt: o.created_at,
  }));
}

/* ============================================================
   GET FULL DASHBOARD DATA
============================================================ */
async function getFullDashboard(salesDays = 7) {
  const [kpis, salesOverview, orderStatus, lowStock, topProducts, recentOrders] = await Promise.all([
    getDashboardKPIs(),
    getSalesOverview(salesDays),
    getOrderStatusBreakdown(),
    getLowStockProducts(5),
    getTopProducts(5),
    getRecentOrders(10),
  ]);

  return {
    kpis,
    salesOverview,
    orderStatus,
    lowStock,
    topProducts,
    recentOrders,
    generatedAt: new Date().toISOString(),
  };
}

/* ============================================================
   GET ADMIN NOTIFICATIONS
   Real-time notifications: new orders, low stock, cancelled orders
============================================================ */
async function getAdminNotifications() {
  const notifications = [];
  const now = new Date();
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now - 60 * 60 * 1000);

  // New orders in last 24 hours
  const newOrders = await Order.findAll({
    where: {
      created_at: { [Op.gte]: twentyFourHoursAgo },
    },
    attributes: ["id", "customer_first_name", "customer_last_name", "total", "created_at"],
    order: [["created_at", "DESC"]],
    limit: 5,
  });

  newOrders.forEach((order) => {
    const customerName = `${order.customer_first_name || ""} ${order.customer_last_name || ""}`.trim() || "Guest";
    const isRecent = new Date(order.created_at) >= oneHourAgo;
    notifications.push({
      id: `order-${order.id}`,
      type: "new_order",
      title: "New Order",
      message: `${customerName} placed an order for Rs. ${parseFloat(order.total).toFixed(2)}`,
      time: order.created_at,
      isNew: isRecent,
      link: `/admin/orders?highlight=${order.id}`,
      icon: "order",
    });
  });

  // Low stock alerts
  const lowStockProducts = await Product.findAll({
    where: { stock: { [Op.lte]: LOW_STOCK_THRESHOLD } },
    attributes: ["id", "name", "stock"],
    order: [["stock", "ASC"]],
    limit: 5,
  });

  lowStockProducts.forEach((product) => {
    notifications.push({
      id: `stock-${product.id}`,
      type: "low_stock",
      title: "Low Stock Alert",
      message: `${product.name} has only ${product.stock} units left`,
      time: now,
      isNew: product.stock === 0,
      link: `/admin/inventory`,
      icon: "warning",
    });
  });

  // Cancelled orders in last 24 hours
  const cancelledOrders = await Order.findAll({
    where: {
      status: { [Op.in]: CANCELLED_STATUSES },
      created_at: { [Op.gte]: twentyFourHoursAgo },
    },
    attributes: ["id", "customer_first_name", "customer_last_name", "total", "created_at"],
    order: [["created_at", "DESC"]],
    limit: 3,
  });

  cancelledOrders.forEach((order) => {
    const customerName = `${order.customer_first_name || ""} ${order.customer_last_name || ""}`.trim() || "Guest";
    notifications.push({
      id: `cancel-${order.id}`,
      type: "cancelled",
      title: "Order Cancelled",
      message: `Order #${order.id} by ${customerName} was cancelled`,
      time: order.created_at,
      isNew: false,
      link: `/admin/orders?highlight=${order.id}`,
      icon: "cancel",
    });
  });

  // Sort by time (newest first) and limit total
  notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
  
  const unreadCount = notifications.filter((n) => n.isNew).length;

  return {
    notifications: notifications.slice(0, 10),
    unreadCount,
    total: notifications.length,
  };
}

/* ============================================================
   GLOBAL SEARCH
   Search across products, orders, and users
============================================================ */
async function globalSearch(query) {
  const searchTerm = `%${query.toLowerCase()}%`;

  // Search products - use description_short instead of description
  const products = await Product.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.iLike]: searchTerm } },
        { description_short: { [Op.iLike]: searchTerm } },
      ],
    },
    attributes: ["id", "name", "price", "stock"],
    include: [
      { model: Category, attributes: ["name", "slug"] },
      { model: ProductImage, attributes: ["image_url"], limit: 1 },
    ],
    limit: 5,
  });

  // Search orders
  const orders = await Order.findAll({
    where: {
      [Op.or]: [
        { customer_first_name: { [Op.iLike]: searchTerm } },
        { customer_last_name: { [Op.iLike]: searchTerm } },
        { customer_email: { [Op.iLike]: searchTerm } },
        { product_name: { [Op.iLike]: searchTerm } },
        sequelize.where(
          sequelize.cast(sequelize.col("Order.id"), "TEXT"),
          { [Op.iLike]: searchTerm }
        ),
      ],
    },
    attributes: ["id", "customer_first_name", "customer_last_name", "total", "status", "created_at"],
    limit: 5,
    order: [["created_at", "DESC"]],
  });

  // Search users - User model has username, not name/email
  const users = await User.findAll({
    where: {
      username: { [Op.iLike]: searchTerm },
      role: "user",
    },
    attributes: ["id", "username"],
    limit: 5,
  });

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price),
      stock: p.stock,
      category: p.Category?.name || "Uncategorized",
      categorySlug: p.Category?.slug || "",
      image: p.ProductImages?.[0]?.image_url || null,
      type: "product",
    })),
    orders: orders.map((o) => ({
      id: o.id,
      customerName: `${o.customer_first_name || ""} ${o.customer_last_name || ""}`.trim() || "Guest",
      total: parseFloat(o.total),
      status: o.status,
      createdAt: o.created_at,
      type: "order",
    })),
    users: users.map((u) => ({
      id: u.id,
      name: u.username,
      email: "",
      type: "user",
    })),
  };
}

module.exports = {
  getDashboardKPIs,
  getSalesOverview,
  getOrderStatusBreakdown,
  getLowStockProducts,
  getTopProducts,
  getRecentOrders,
  getFullDashboard,
  getAdminNotifications,
  globalSearch,
};
