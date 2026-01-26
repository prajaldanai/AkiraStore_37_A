const { Order, OrderItem, User } = require("../models");
const { Op } = require("sequelize");
const stockService = require("../services/inventory/stockService");

/* ============================================================
   ORDER STATUS STATE MACHINE
============================================================ */

// Valid statuses (normalized uppercase)
const ORDER_STATUSES = {
  PLACED: "PLACED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

// Legacy status mapping (from user order flow)
// Maps old lowercase statuses to normalized uppercase
const LEGACY_STATUS_MAP = {
  "pending": "PLACED",
  "pending_confirmation": "PLACED",
  "confirmed": "PLACED",
  "processing": "PROCESSING",
  "shipped": "SHIPPED",
  "delivered": "DELIVERED",
  "cancelled": "CANCELLED",
};

// Active statuses (shown in Orders page) - include both normalized and legacy
const ACTIVE_STATUSES = [
  ORDER_STATUSES.PLACED,
  ORDER_STATUSES.PROCESSING,
  ORDER_STATUSES.SHIPPED,
  // Legacy statuses (lowercase from user order flow)
  "pending",
  "pending_confirmation",
  "confirmed",
  "processing",
  "shipped",
];

// Final statuses (shown in History page)
const FINAL_STATUSES = [
  ORDER_STATUSES.DELIVERED,
  ORDER_STATUSES.CANCELLED,
  // Legacy
  "delivered",
  "cancelled",
];

/**
 * Normalize status to uppercase format
 */
function normalizeStatus(status) {
  if (!status) return ORDER_STATUSES.PLACED;
  const upper = status.toUpperCase();
  if (Object.values(ORDER_STATUSES).includes(upper)) return upper;
  return LEGACY_STATUS_MAP[status.toLowerCase()] || ORDER_STATUSES.PLACED;
}

// Valid status transitions
const VALID_TRANSITIONS = {
  [ORDER_STATUSES.PLACED]: [ORDER_STATUSES.PROCESSING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PROCESSING]: [ORDER_STATUSES.SHIPPED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.SHIPPED]: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.DELIVERED]: [], // Final - no transitions allowed
  [ORDER_STATUSES.CANCELLED]: [], // Final - no transitions allowed
};

/**
 * Check if a status transition is valid
 */
function isValidTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

/**
 * Get timestamp field name for a status
 */
function getTimestampField(status) {
  const mapping = {
    [ORDER_STATUSES.PROCESSING]: "processed_at",
    [ORDER_STATUSES.SHIPPED]: "shipped_at",
    [ORDER_STATUSES.DELIVERED]: "delivered_at",
    [ORDER_STATUSES.CANCELLED]: "cancelled_at",
  };
  return mapping[status] || null;
}

/* ============================================================
   HELPERS
============================================================ */

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

function buildImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  let path = String(imagePath).replace(/\\/g, "/");
  if (!path.startsWith("/uploads")) {
    path = `/uploads/${path.replace(/^\//, "")}`;
  }
  return `${BASE_URL}${path}`;
}

/**
 * Format order for API response
 */
function formatOrderResponse(order, includeItems = true) {
  const formatted = {
    id: order.id,
    userId: order.user_id,
    status: normalizeStatus(order.status), // Normalize to uppercase
    rawStatus: order.status, // Keep original for debugging
    
    // Customer snapshot
    customer: {
      fullName: `${order.customer_first_name} ${order.customer_last_name}`,
      firstName: order.customer_first_name,
      lastName: order.customer_last_name,
      email: order.customer_email,
      phone: order.customer_phone,
      province: order.customer_province,
      city: order.customer_city,
      address: order.customer_address,
    },
    
    // Pricing
    subtotal: order.subtotal,
    shippingCharge: order.shipping_charge_snapshot,
    shippingType: order.shipping_type,
    shippingMethodLabel: order.shipping_method_label || `${order.shipping_type} - Rs ${order.shipping_charge_snapshot}`,
    giftBox: order.gift_box,
    giftBoxFee: order.gift_box_fee,
    bargainDiscount: order.bargain_discount,
    taxAmount: order.tax_amount,
    total: order.total,
    
    // Timestamps for timeline
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    processedAt: order.processed_at,
    shippedAt: order.shipped_at,
    deliveredAt: order.delivered_at,
    cancelledAt: order.cancelled_at,
  };
  
  // Include items if available and requested
  if (includeItems) {
    // Check if order has OrderItem entries
    if (order.items && order.items.length > 0) {
      formatted.items = order.items.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name_snapshot,
        productImage: buildImageUrl(item.product_image_snapshot),
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unit_price_snapshot,
        lineTotal: item.line_total_snapshot,
      }));
      formatted.itemsCount = order.items.length;
    } else {
      // Fall back to legacy single-product order fields
      formatted.items = [{
        id: null,
        productId: order.product_id,
        productName: order.product_name,
        productImage: buildImageUrl(order.product_image),
        size: order.selected_size,
        quantity: order.quantity,
        unitPrice: order.unit_price_snapshot || order.subtotal,
        lineTotal: order.subtotal,
      }];
      formatted.itemsCount = 1;
    }
  } else {
    // For list view, compute items count
    formatted.itemsCount = (order.items && order.items.length > 0) ? order.items.length : 1;
  }
  
  return formatted;
}

/* ============================================================
   GET ADMIN ORDERS
   GET /api/admin/orders?scope=active|history
============================================================ */
exports.getAdminOrders = async (req, res) => {
  try {
    const { 
      scope = "active",
      search = "",
      status = "",
      page = 1,
      limit = 20,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = req.query;
    
    // Determine which statuses to filter by
    let statusFilter;
    if (scope === "history") {
      statusFilter = FINAL_STATUSES;
    } else {
      statusFilter = ACTIVE_STATUSES;
    }
    
    // Further filter by specific status if provided
    if (status && statusFilter.includes(status.toUpperCase())) {
      statusFilter = [status.toUpperCase()];
    }
    
    // Build where clause
    const where = {
      status: { [Op.in]: statusFilter },
    };
    
    // Search filter (orderId, email, phone, name)
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      const searchConditions = [
        { customer_email: { [Op.iLike]: searchTerm } },
        { customer_phone: { [Op.iLike]: searchTerm } },
        { customer_first_name: { [Op.iLike]: searchTerm } },
        { customer_last_name: { [Op.iLike]: searchTerm } },
      ];
      
      // Only search by UUID if the search term looks like a UUID (contains only hex and dashes)
      const uuidPattern = /^[0-9a-f-]+$/i;
      if (uuidPattern.test(search.trim())) {
        searchConditions.push({ id: { [Op.iLike]: searchTerm } });
      }
      
      where[Op.or] = searchConditions;
    }
    
    const offset = (Number(page) - 1) * Number(limit);
    
    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          as: "items",
          required: false,
        },
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: Number(limit),
      offset,
      distinct: true,
    });
    
    return res.json({
      success: true,
      orders: orders.map(order => formatOrderResponse(order, true)),
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
      scope,
    });
    
  } catch (error) {
    console.error("getAdminOrders ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch orders" 
    });
  }
};

/* ============================================================
   GET ADMIN ORDER BY ID
   GET /api/admin/orders/:orderId
============================================================ */
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  exports.getAdminOrderById = async (req, res) => {
    try {
      const { orderId } = req.params;
      if (!UUID_PATTERN.test(orderId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID format",
        });
      }
      
      const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: "items",
          required: false,
        },
        {
          model: User,
          attributes: ["id", "username"],
          required: false,
        },
      ],
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    const formatted = formatOrderResponse(order, true);
    
    // Add user info if available
    if (order.User) {
      formatted.user = {
        id: order.User.id,
        username: order.User.username,
      };
    }
    
    return res.json({
      success: true,
      order: formatted,
    });
    
  } catch (error) {
    console.error("getAdminOrderById ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch order" 
    });
  }
};

/* ============================================================
   UPDATE ORDER STATUS
   PATCH /api/admin/orders/:orderId/status
============================================================ */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status: newStatus } = req.body;
    
    if (!newStatus) {
      return res.status(400).json({ 
        success: false, 
        message: "Status is required" 
      });
    }
    
    const normalizedStatus = newStatus.toUpperCase();
    
    // Validate status value
    if (!Object.values(ORDER_STATUSES).includes(normalizedStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${Object.values(ORDER_STATUSES).join(", ")}` 
      });
    }
    
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    // Normalize current status using the legacy mapping function
    const currentStatus = normalizeStatus(order.status);
    
    // Check if transition is valid
    if (!isValidTransition(currentStatus, normalizedStatus)) {
      const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
      return res.status(400).json({ 
        success: false, 
        message: `Cannot change status from ${currentStatus} to ${normalizedStatus}. Allowed transitions: ${allowedTransitions.length > 0 ? allowedTransitions.join(", ") : "none (final status)"}` 
      });
    }
    
    // Prepare update data
    const updateData = {
      status: normalizedStatus,
      updated_at: new Date(),
    };
    
    // Set appropriate timestamp
    const timestampField = getTimestampField(normalizedStatus);
    if (timestampField) {
      updateData[timestampField] = new Date();
    }
    
    // ✅ STOCK RESTORATION: If order is being cancelled, restore stock
    let stockRestoreResult = null;
    if (normalizedStatus === ORDER_STATUSES.CANCELLED) {
      // Only restore stock if order was previously confirmed (stock was deducted)
      // Orders in pending_confirmation status haven't had stock deducted yet
      const previousConfirmedStatuses = ["confirmed", "PLACED", "processing", "PROCESSING", "shipped", "SHIPPED"];
      const wasConfirmed = previousConfirmedStatuses.includes(order.status);
      
      if (wasConfirmed && order.product_id && order.quantity) {
        try {
          stockRestoreResult = await stockService.restoreStock(
            order.product_id,
            order.quantity
          );
          console.log(`📦 Stock restored for cancelled order #${orderId}:`, stockRestoreResult);
        } catch (stockError) {
          console.error(`❌ Failed to restore stock for order #${orderId}:`, stockError);
          // Continue with order cancellation even if stock restore fails
        }
      }
    }
    
    await order.update(updateData);
    
    // Reload with items
    await order.reload({
      include: [
        {
          model: OrderItem,
          as: "items",
          required: false,
        },
      ],
    });
    
    return res.json({
      success: true,
      message: `Order status updated to ${normalizedStatus}`,
      order: formatOrderResponse(order, true),
      stockRestored: stockRestoreResult ? {
        productId: stockRestoreResult.productId,
        restoredBy: stockRestoreResult.restoredBy,
        newStock: stockRestoreResult.newStock,
      } : null,
    });
    
  } catch (error) {
    console.error("updateOrderStatus ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to update order status" 
    });
  }
};

/* ============================================================
   GET ORDER STATS (for dashboard widgets)
   GET /api/admin/orders/stats
============================================================ */
exports.getOrderStats = async (req, res) => {
  try {
    // Count statuses including legacy lowercase values
    const placedStatuses = ["PLACED", "pending", "pending_confirmation", "confirmed"];
    const processingStatuses = ["PROCESSING", "processing"];
    const shippedStatuses = ["SHIPPED", "shipped"];
    const deliveredStatuses = ["DELIVERED", "delivered"];
    const cancelledStatuses = ["CANCELLED", "cancelled"];
    
    const stats = await Promise.all([
      Order.count({ where: { status: { [Op.in]: placedStatuses } } }),
      Order.count({ where: { status: { [Op.in]: processingStatuses } } }),
      Order.count({ where: { status: { [Op.in]: shippedStatuses } } }),
      Order.count({ where: { status: { [Op.in]: deliveredStatuses } } }),
      Order.count({ where: { status: { [Op.in]: cancelledStatuses } } }),
      Order.count({ where: { status: { [Op.in]: ACTIVE_STATUSES } } }),
    ]);
    
    return res.json({
      success: true,
      stats: {
        placed: stats[0],
        processing: stats[1],
        shipped: stats[2],
        delivered: stats[3],
        cancelled: stats[4],
        activeTotal: stats[5],
      },
    });
    
  } catch (error) {
    console.error("getOrderStats ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch order stats" 
    });
  }
};
