/**
 * Sales Report Service
 * Aggregates order data for admin sales analytics
 * Only counts DELIVERED orders as revenue
 */

const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("../../database/sequelize");
const { Order, Product, Category, ProductImage, User } = require("../../models");

// Status constants
const DELIVERED_STATUSES = ["DELIVERED", "delivered"];
const CANCELLED_STATUSES = ["CANCELLED", "cancelled"];
const PROCESSING_STATUSES = ["PROCESSING", "processing", "PLACED", "placed", "pending", "pending_confirmation", "confirmed", "SHIPPED", "shipped"];

// Low stock threshold
const LOW_STOCK_THRESHOLD = 5;

/* ============================================================
   HELPER: Build date filter
============================================================ */
function buildDateFilter(fromDate, toDate) {
  const where = {};
  
  if (fromDate || toDate) {
    where.created_at = {};
    if (fromDate) {
      where.created_at[Op.gte] = new Date(fromDate);
    }
    if (toDate) {
      // Include the entire end date
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      where.created_at[Op.lte] = endDate;
    }
  }
  
  return where;
}

/* ============================================================
   GET KPIs (Key Performance Indicators)
============================================================ */
async function getKPIs(fromDate, toDate, categoryId) {
  const dateFilter = buildDateFilter(fromDate, toDate);
  
  // Base where clause for delivered orders
  const deliveredWhere = {
    ...dateFilter,
    status: { [Op.in]: DELIVERED_STATUSES },
  };
  
  // If category filter, need to join with Product
  let deliveredOrders;
  if (categoryId) {
    deliveredOrders = await Order.findAll({
      where: deliveredWhere,
      include: [{
        model: Product,
        where: { category_id: categoryId },
        attributes: [],
        required: true,
      }],
      attributes: [
        [fn("COUNT", col("Order.id")), "count"],
        [fn("SUM", col("Order.total")), "totalRevenue"],
      ],
      raw: true,
    });
  } else {
    deliveredOrders = await Order.findAll({
      where: deliveredWhere,
      attributes: [
        [fn("COUNT", col("id")), "count"],
        [fn("SUM", col("total")), "totalRevenue"],
      ],
      raw: true,
    });
  }
  
  const totalSales = parseFloat(deliveredOrders[0]?.totalRevenue) || 0;
  const deliveredCount = parseInt(deliveredOrders[0]?.count) || 0;
  const avgOrderValue = deliveredCount > 0 ? totalSales / deliveredCount : 0;
  
  // Cancelled orders count
  const cancelledWhere = {
    ...dateFilter,
    status: { [Op.in]: CANCELLED_STATUSES },
  };
  
  const cancelledCount = await Order.count({ where: cancelledWhere });
  
  // Low stock products count
  const lowStockCount = await Product.count({
    where: {
      stock: { [Op.lte]: LOW_STOCK_THRESHOLD },
    },
  });
  
  // Total orders (all statuses)
  const totalOrdersCount = await Order.count({ where: dateFilter });
  
  return {
    totalSales: Math.round(totalSales * 100) / 100,
    deliveredOrders: deliveredCount,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    cancelledOrders: cancelledCount,
    lowStockProducts: lowStockCount,
    totalOrders: totalOrdersCount,
  };
}

/* ============================================================
   GET SALES TREND (Daily revenue for chart)
============================================================ */
async function getSalesTrend(fromDate, toDate) {
  // Default to last 30 days if no dates provided
  const endDate = toDate ? new Date(toDate) : new Date();
  const startDate = fromDate ? new Date(fromDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Set time boundaries
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  // Get daily aggregated sales for delivered orders
  const dailySales = await Order.findAll({
    where: {
      status: { [Op.in]: DELIVERED_STATUSES },
      created_at: {
        [Op.between]: [startDate, endDate],
      },
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
  
  // Fill in missing dates with zero values
  const trend = [];
  const salesMap = new Map();
  
  dailySales.forEach((row) => {
    const dateStr = new Date(row.date).toISOString().split("T")[0];
    salesMap.set(dateStr, {
      date: dateStr,
      revenue: parseFloat(row.revenue) || 0,
      orders: parseInt(row.orders) || 0,
    });
  });
  
  // Generate all dates in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    trend.push(salesMap.get(dateStr) || {
      date: dateStr,
      revenue: 0,
      orders: 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return trend;
}

/* ============================================================
   GET CATEGORY BREAKDOWN (Revenue per category)
============================================================ */
async function getCategoryBreakdown(fromDate, toDate) {
  const dateFilter = buildDateFilter(fromDate, toDate);
  
  // Get all delivered orders with product info
  const orders = await Order.findAll({
    where: {
      ...dateFilter,
      status: { [Op.in]: DELIVERED_STATUSES },
    },
    attributes: ["product_id", "total", "quantity"],
    raw: true,
  });
  
  // Get product-category mapping
  const productIds = [...new Set(orders.map((o) => o.product_id))];
  
  if (productIds.length === 0) {
    return [];
  }
  
  const products = await Product.findAll({
    where: { id: { [Op.in]: productIds } },
    include: [{
      model: Category,
      attributes: ["id", "name", "slug"],
    }],
    attributes: ["id", "category_id"],
    raw: true,
    nest: true,
  });
  
  const productCategoryMap = new Map();
  products.forEach((p) => {
    productCategoryMap.set(p.id, p.Category);
  });
  
  // Aggregate by category
  const categoryStats = new Map();
  
  orders.forEach((order) => {
    const category = productCategoryMap.get(order.product_id);
    const catId = category?.id || 0;
    const catName = category?.name || "Uncategorized";
    
    if (!categoryStats.has(catId)) {
      categoryStats.set(catId, {
        id: catId,
        name: catName,
        revenue: 0,
        orders: 0,
        units: 0,
      });
    }
    
    const stats = categoryStats.get(catId);
    stats.revenue += parseFloat(order.total) || 0;
    stats.orders += 1;
    stats.units += order.quantity || 1;
  });
  
  // Convert to array and sort by revenue
  return Array.from(categoryStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .map((cat) => ({
      ...cat,
      revenue: Math.round(cat.revenue * 100) / 100,
    }));
}

/* ============================================================
   GET ORDER STATUS BREAKDOWN (For donut chart)
============================================================ */
async function getOrderStatusBreakdown(fromDate, toDate) {
  const dateFilter = buildDateFilter(fromDate, toDate);
  
  // Get counts by status group
  const delivered = await Order.count({
    where: { ...dateFilter, status: { [Op.in]: DELIVERED_STATUSES } },
  });
  
  const cancelled = await Order.count({
    where: { ...dateFilter, status: { [Op.in]: CANCELLED_STATUSES } },
  });
  
  const processing = await Order.count({
    where: { ...dateFilter, status: { [Op.in]: PROCESSING_STATUSES } },
  });
  
  return [
    { status: "Delivered", count: delivered, color: "#51cf66" },
    { status: "Processing", count: processing, color: "#339af0" },
    { status: "Cancelled", count: cancelled, color: "#ff6b6b" },
  ];
}

/* ============================================================
   GET TOP SELLING PRODUCTS
============================================================ */
async function getTopProducts(fromDate, toDate, limit = 10) {
  const dateFilter = buildDateFilter(fromDate, toDate);
  
  // Aggregate sales per product from delivered orders
  const productSales = await Order.findAll({
    where: {
      ...dateFilter,
      status: { [Op.in]: DELIVERED_STATUSES },
    },
    attributes: [
      "product_id",
      "product_name",
      "product_image",
      [fn("SUM", col("quantity")), "unitsSold"],
      [fn("SUM", col("total")), "revenue"],
      [fn("COUNT", col("id")), "orderCount"],
    ],
    group: ["product_id", "product_name", "product_image"],
    order: [[fn("SUM", col("total")), "DESC"]],
    limit,
    raw: true,
  });
  
  // Get current stock and category for each product
  const productIds = productSales.map((p) => p.product_id);
  
  const productsInfo = await Product.findAll({
    where: { id: { [Op.in]: productIds } },
    include: [
      { model: Category, attributes: ["id", "name"] },
      { model: ProductImage, attributes: ["image_url"], limit: 1 },
    ],
    attributes: ["id", "stock", "name"],
  });
  
  const productInfoMap = new Map();
  productsInfo.forEach((p) => {
    productInfoMap.set(p.id, {
      stock: p.stock || 0,
      category: p.Category?.name || "Uncategorized",
      currentImage: p.ProductImages?.[0]?.image_url || null,
    });
  });
  
  const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
  
  return productSales.map((p) => {
    const info = productInfoMap.get(p.product_id) || {};
    let imageUrl = p.product_image || info.currentImage;
    
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = imageUrl.replace(/\\/g, "/");
      if (!imageUrl.startsWith("/uploads")) {
        imageUrl = `/uploads/${imageUrl.replace(/^\//, "")}`;
      }
      imageUrl = `${BASE_URL}${imageUrl}`;
    }
    
    return {
      productId: p.product_id,
      name: p.product_name,
      image: imageUrl,
      category: info.category,
      unitsSold: parseInt(p.unitsSold) || 0,
      revenue: Math.round(parseFloat(p.revenue) * 100) / 100,
      stock: info.stock,
      isLowStock: info.stock <= LOW_STOCK_THRESHOLD,
    };
  });
}

/* ============================================================
   GET LOW STOCK PRODUCTS (with sales data)
============================================================ */
async function getLowStockProducts(fromDate, toDate, limit = 10) {
  const dateFilter = buildDateFilter(fromDate, toDate);
  
  // Get products with low stock
  const lowStockProducts = await Product.findAll({
    where: {
      stock: { [Op.lte]: LOW_STOCK_THRESHOLD },
    },
    include: [
      { model: Category, attributes: ["id", "name"] },
      { model: ProductImage, attributes: ["image_url"], limit: 1 },
    ],
    attributes: ["id", "name", "stock", "price"],
    order: [["stock", "ASC"]],
    limit,
  });
  
  // Get sales data for these products
  const productIds = lowStockProducts.map((p) => p.id);
  
  const salesData = await Order.findAll({
    where: {
      ...dateFilter,
      product_id: { [Op.in]: productIds },
      status: { [Op.in]: DELIVERED_STATUSES },
    },
    attributes: [
      "product_id",
      [fn("SUM", col("quantity")), "unitsSold"],
    ],
    group: ["product_id"],
    raw: true,
  });
  
  const salesMap = new Map();
  salesData.forEach((s) => {
    salesMap.set(s.product_id, parseInt(s.unitsSold) || 0);
  });
  
  const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
  
  return lowStockProducts.map((p) => {
    let imageUrl = p.ProductImages?.[0]?.image_url;
    
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = imageUrl.replace(/\\/g, "/");
      if (!imageUrl.startsWith("/uploads")) {
        imageUrl = `/uploads/${imageUrl.replace(/^\//, "")}`;
      }
      imageUrl = `${BASE_URL}${imageUrl}`;
    }
    
    return {
      productId: p.id,
      name: p.name,
      image: imageUrl || null,
      category: p.Category?.name || "Uncategorized",
      stock: p.stock,
      price: p.price,
      unitsSold: salesMap.get(p.id) || 0,
    };
  });
}

/* ============================================================
   GET TOP CUSTOMERS
============================================================ */
async function getTopCustomers(fromDate, toDate, limit = 10) {
  const dateFilter = buildDateFilter(fromDate, toDate);
  
  // Aggregate by customer email for delivered orders
  const customerStats = await Order.findAll({
    where: {
      ...dateFilter,
      status: { [Op.in]: DELIVERED_STATUSES },
    },
    attributes: [
      "customer_email",
      "customer_first_name",
      "customer_last_name",
      "user_id",
      [fn("COUNT", col("id")), "orderCount"],
      [fn("SUM", col("total")), "totalSpent"],
    ],
    group: ["customer_email", "customer_first_name", "customer_last_name", "user_id"],
    order: [[fn("SUM", col("total")), "DESC"]],
    limit,
    raw: true,
  });
  
  return customerStats.map((c) => ({
    userId: c.user_id,
    name: `${c.customer_first_name} ${c.customer_last_name}`.trim(),
    email: c.customer_email,
    orderCount: parseInt(c.orderCount) || 0,
    totalSpent: Math.round(parseFloat(c.totalSpent) * 100) / 100,
  }));
}

/* ============================================================
   MAIN: Get Full Sales Report
============================================================ */
async function getFullSalesReport(options = {}) {
  const { fromDate, toDate, categoryId } = options;
  
  // Fetch all data in parallel for performance
  const [
    kpis,
    salesTrend,
    categoryBreakdown,
    orderStatusBreakdown,
    topProducts,
    lowStockProducts,
    topCustomers,
  ] = await Promise.all([
    getKPIs(fromDate, toDate, categoryId),
    getSalesTrend(fromDate, toDate),
    getCategoryBreakdown(fromDate, toDate),
    getOrderStatusBreakdown(fromDate, toDate),
    getTopProducts(fromDate, toDate, 10),
    getLowStockProducts(fromDate, toDate, 10),
    getTopCustomers(fromDate, toDate, 10),
  ]);
  
  return {
    kpis,
    salesTrend,
    categoryBreakdown,
    orderStatusBreakdown,
    topProducts,
    lowStockProducts,
    topCustomers,
    filters: {
      fromDate: fromDate || null,
      toDate: toDate || null,
      categoryId: categoryId || null,
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getKPIs,
  getSalesTrend,
  getCategoryBreakdown,
  getOrderStatusBreakdown,
  getTopProducts,
  getLowStockProducts,
  getTopCustomers,
  getFullSalesReport,
};
