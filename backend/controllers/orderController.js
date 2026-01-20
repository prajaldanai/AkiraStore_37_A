const { Order, BuyNowSession, User, Product } = require("../models");
const { Op } = require("sequelize");

/* ============================================================
   HELPERS
============================================================ */
const GIFT_BOX_FEE = 20; // Rs. 20 for gift box

/**
 * Validate customer form fields
 */
function validateCustomerForm(data) {
  const required = [
    "customerEmail",
    "customerFirstName",
    "customerLastName",
    "customerProvince",
    "customerCity",
    "customerAddress",
    "customerPhone",
  ];

  const missing = required.filter((field) => !data[field] || String(data[field]).trim() === "");
  
  if (missing.length > 0) {
    return { valid: false, message: `Missing fields: ${missing.join(", ")}` };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.customerEmail)) {
    return { valid: false, message: "Invalid email format" };
  }

  // Basic phone validation (at least 10 digits)
  const phoneDigits = String(data.customerPhone).replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    return { valid: false, message: "Phone number must have at least 10 digits" };
  }

  return { valid: true };
}

/* ============================================================
   CREATE ORDER
   POST /api/orders
============================================================ */
exports.createOrder = async (req, res) => {
  try {
    const {
      sessionId,
      shippingType,
      shippingCharge,
      giftBox,
      bargainDiscount,
      bargainFinalPrice,
      bargainChatLog,
      customerEmail,
      customerFirstName,
      customerLastName,
      customerProvince,
      customerCity,
      customerAddress,
      customerPhone,
    } = req.body;

    const userId = req.user?.id || null;

    // Validate customer form
    const validation = validateCustomerForm({
      customerEmail,
      customerFirstName,
      customerLastName,
      customerProvince,
      customerCity,
      customerAddress,
      customerPhone,
    });

    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    // Validate shipping
    if (!shippingType) {
      return res.status(400).json({ success: false, message: "Shipping type is required" });
    }

    // Get session data
    let sessionData = null;
    if (sessionId) {
      const session = await BuyNowSession.findByPk(sessionId);
      if (session && session.status === "active") {
        sessionData = session;
      }
    }

    if (!sessionData) {
      return res.status(400).json({ success: false, message: "Valid session required" });
    }

    // Calculate totals
    const unitPrice = Number(sessionData.unit_price) || 0;
    const quantity = Number(sessionData.quantity) || 1;
    const subtotal = unitPrice * quantity;
    const safeShippingCharge = Number(shippingCharge) || 0;
    const safeBargainDiscount = Math.min(Number(bargainDiscount) || 0, subtotal * 0.10); // Max 10%
    const giftBoxFee = giftBox ? GIFT_BOX_FEE : 0;
    const taxAmount = 0; // For future use

    const total = subtotal - safeBargainDiscount + safeShippingCharge + giftBoxFee + taxAmount;

    // Create order with PENDING_CONFIRMATION status (not finalized yet)
    const order = await Order.create({
      session_id: sessionId,
      user_id: userId,
      product_id: sessionData.product_id,
      product_name: sessionData.product_name,
      product_image: sessionData.product_image,
      selected_size: sessionData.selected_size,
      quantity: quantity,
      unit_price_snapshot: unitPrice,
      shipping_type: shippingType,
      shipping_charge_snapshot: safeShippingCharge,
      gift_box: !!giftBox,
      gift_box_fee: giftBoxFee,
      bargain_discount: safeBargainDiscount,
      bargain_final_price: bargainFinalPrice || null,
      bargain_chat_log: bargainChatLog || [],
      tax_amount: taxAmount,
      subtotal: subtotal,
      total: total,
      customer_email: customerEmail.trim(),
      customer_first_name: customerFirstName.trim(),
      customer_last_name: customerLastName.trim(),
      customer_province: customerProvince.trim(),
      customer_city: customerCity.trim(),
      customer_address: customerAddress.trim(),
      customer_phone: customerPhone.trim(),
      status: "pending_confirmation", // Changed: order awaits user confirmation
    });

    // Don't mark session as completed yet - wait for confirmation
    // await sessionData.update({ status: "completed" });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        id: order.id,
        productName: order.product_name,
        quantity: order.quantity,
        subtotal: order.subtotal,
        shippingCharge: order.shipping_charge_snapshot,
        giftBoxFee: order.gift_box_fee,
        bargainDiscount: order.bargain_discount,
        total: order.total,
        status: order.status,
        createdAt: order.created_at,
      },
    });

  } catch (error) {
    console.error("createOrder ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

/* ============================================================
   GET ALL ORDERS (ADMIN)
   GET /api/admin/orders
============================================================ */
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: Number(limit),
      offset,
      include: [
        { model: User, attributes: ["id", "email", "name"], required: false },
      ],
    });

    return res.json({
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        sessionId: o.session_id,
        userId: o.user_id,
        user: o.User ? { id: o.User.id, email: o.User.email, name: o.User.name } : null,
        productId: o.product_id,
        productName: o.product_name,
        productImage: o.product_image,
        selectedSize: o.selected_size,
        quantity: o.quantity,
        unitPrice: o.unit_price_snapshot,
        shippingType: o.shipping_type,
        shippingCharge: o.shipping_charge_snapshot,
        giftBox: o.gift_box,
        giftBoxFee: o.gift_box_fee,
        bargainDiscount: o.bargain_discount,
        bargainFinalPrice: o.bargain_final_price,
        subtotal: o.subtotal,
        total: o.total,
        customer: {
          email: o.customer_email,
          firstName: o.customer_first_name,
          lastName: o.customer_last_name,
          province: o.customer_province,
          city: o.customer_city,
          address: o.customer_address,
          phone: o.customer_phone,
        },
        status: o.status,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      })),
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });

  } catch (error) {
    console.error("getAllOrders ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

/* ============================================================
   GET ORDER BY ID (ADMIN)
   GET /api/admin/orders/:orderId
============================================================ */
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId, {
      include: [
        { model: User, attributes: ["id", "email", "name"], required: false },
        { model: BuyNowSession, required: false },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({
      success: true,
      order: {
        id: order.id,
        sessionId: order.session_id,
        session: order.BuyNowSession ? {
          id: order.BuyNowSession.id,
          shippingOptions: order.BuyNowSession.shipping_options,
          createdAt: order.BuyNowSession.created_at,
        } : null,
        userId: order.user_id,
        user: order.User ? { id: order.User.id, email: order.User.email, name: order.User.name } : null,
        productId: order.product_id,
        productName: order.product_name,
        productImage: order.product_image,
        selectedSize: order.selected_size,
        quantity: order.quantity,
        unitPrice: order.unit_price_snapshot,
        shippingType: order.shipping_type,
        shippingCharge: order.shipping_charge_snapshot,
        giftBox: order.gift_box,
        giftBoxFee: order.gift_box_fee,
        bargainDiscount: order.bargain_discount,
        bargainFinalPrice: order.bargain_final_price,
        bargainChatLog: order.bargain_chat_log,
        taxAmount: order.tax_amount,
        subtotal: order.subtotal,
        total: order.total,
        customer: {
          email: order.customer_email,
          firstName: order.customer_first_name,
          lastName: order.customer_last_name,
          province: order.customer_province,
          city: order.customer_city,
          address: order.customer_address,
          phone: order.customer_phone,
        },
        status: order.status,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
    });

  } catch (error) {
    console.error("getOrderById ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

/* ============================================================
   UPDATE ORDER STATUS (ADMIN)
   PUT /api/admin/orders/:orderId/status
============================================================ */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` 
      });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await order.update({ status, updated_at: new Date() });

    return res.json({
      success: true,
      message: "Order status updated",
      order: {
        id: order.id,
        status: order.status,
        updatedAt: order.updated_at,
      },
    });

  } catch (error) {
    console.error("updateOrderStatus ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update order status" });
  }
};

/* ============================================================
   GET ORDER BY ID (USER - for confirmation page)
   GET /api/orders/:orderId
============================================================ */
exports.getUserOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id || null;

    const order = await Order.findByPk(orderId, {
      include: [
        { model: BuyNowSession, required: false },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Helper to ensure number values (avoid NaN on frontend)
    const safeNum = (val) => {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    // Helper to build full image URL
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
    const buildImageUrl = (imagePath) => {
      if (!imagePath) return null;
      // If already a full URL, return as is
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
      }
      // Normalize path
      let path = String(imagePath).replace(/\\/g, "/");
      // Ensure starts with /uploads
      if (!path.startsWith("/uploads")) {
        path = `/uploads/${path.replace(/^\//, "")}`;
      }
      return `${BASE_URL}${path}`;
    };

    // Build response with proper numeric values and full image URLs
    return res.json({
      success: true,
      order: {
        id: order.id,
        sessionId: order.session_id,
        // Product details (supports array structure for future multi-item)
        items: [
          {
            productId: order.product_id,
            productName: order.product_name || "Unknown Product",
            productImage: buildImageUrl(order.product_image),
            selectedSize: order.selected_size || null,
            quantity: safeNum(order.quantity) || 1,
            unitPrice: safeNum(order.unit_price_snapshot),
            lineTotal: safeNum(order.unit_price_snapshot) * (safeNum(order.quantity) || 1),
          }
        ],
        // Shipping
        shippingType: order.shipping_type || "Standard",
        shippingCharge: safeNum(order.shipping_charge_snapshot),
        // Extras
        giftBox: order.gift_box === true,
        giftBoxFee: safeNum(order.gift_box_fee),
        // Bargain
        bargainApplied: safeNum(order.bargain_discount) > 0,
        bargainDiscount: safeNum(order.bargain_discount),
        bargainFinalPrice: order.bargain_final_price ? safeNum(order.bargain_final_price) : null,
        // Totals
        subtotal: safeNum(order.subtotal),
        taxAmount: safeNum(order.tax_amount),
        total: safeNum(order.total),
        // Customer details
        customer: {
          email: order.customer_email || "",
          firstName: order.customer_first_name || "",
          lastName: order.customer_last_name || "",
          fullName: `${order.customer_first_name || ""} ${order.customer_last_name || ""}`.trim(),
          province: order.customer_province || "",
          city: order.customer_city || "",
          address: order.customer_address || "",
          phone: order.customer_phone || "",
        },
        // Status
        status: order.status,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
    });

  } catch (error) {
    console.error("getUserOrderById ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

/* ============================================================
   CONFIRM ORDER (USER - finalize order)
   POST /api/orders/:orderId/confirm
============================================================ */
exports.confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId, {
      include: [{ model: BuyNowSession, required: false }],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only allow confirming orders that are pending_confirmation
    if (order.status !== "pending_confirmation") {
      return res.status(400).json({ 
        success: false, 
        message: `Order cannot be confirmed. Current status: ${order.status}` 
      });
    }

    // Update order status to confirmed
    await order.update({ 
      status: "confirmed", 
      updated_at: new Date() 
    });

    // Now mark the session as completed
    if (order.BuyNowSession) {
      await order.BuyNowSession.update({ status: "completed" });
    }

    return res.json({
      success: true,
      message: "Order confirmed successfully",
      order: {
        id: order.id,
        status: order.status,
        total: order.total,
        updatedAt: order.updated_at,
      },
    });

  } catch (error) {
    console.error("confirmOrder ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to confirm order" });
  }
};

/* ============================================================
   GET MY ORDERS (USER - only logged-in user's orders)
   GET /api/orders/my
============================================================ */
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const where = { user_id: userId };
    if (status) {
      where.status = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    // Helper to build full image URL
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
    const buildImageUrl = (imagePath) => {
      if (!imagePath) return null;
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
      }
      let path = String(imagePath).replace(/\\/g, "/");
      if (!path.startsWith("/uploads")) {
        path = `/uploads/${path.replace(/^\//, "")}`;
      }
      return `${BASE_URL}${path}`;
    };

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: Number(limit),
      offset,
    });

    return res.json({
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        productId: o.product_id,
        productName: o.product_name,
        productImage: buildImageUrl(o.product_image),
        selectedSize: o.selected_size,
        quantity: o.quantity,
        unitPrice: o.unit_price_snapshot,
        shippingType: o.shipping_type,
        shippingCharge: o.shipping_charge_snapshot,
        giftBox: o.gift_box,
        giftBoxFee: o.gift_box_fee,
        bargainDiscount: o.bargain_discount,
        subtotal: o.subtotal,
        total: o.total,
        status: o.status,
        createdAt: o.created_at,
      })),
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });

  } catch (error) {
    console.error("getMyOrders ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

/* ============================================================
   GET MY ORDER BY ID (USER - only if order belongs to user)
   GET /api/orders/my/:orderId
============================================================ */
exports.getMyOrderById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const order = await Order.findByPk(orderId, {
      include: [{ model: BuyNowSession, required: false }],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Security: Only allow user to view their own orders
    if (order.user_id !== userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Helper to ensure number values
    const safeNum = (val) => {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };

    // Helper to build full image URL
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
    const buildImageUrl = (imagePath) => {
      if (!imagePath) return null;
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
      }
      let path = String(imagePath).replace(/\\/g, "/");
      if (!path.startsWith("/uploads")) {
        path = `/uploads/${path.replace(/^\//, "")}`;
      }
      return `${BASE_URL}${path}`;
    };

    return res.json({
      success: true,
      order: {
        id: order.id,
        sessionId: order.session_id,
        items: [
          {
            productId: order.product_id,
            productName: order.product_name || "Unknown Product",
            productImage: buildImageUrl(order.product_image),
            selectedSize: order.selected_size || null,
            quantity: safeNum(order.quantity) || 1,
            unitPrice: safeNum(order.unit_price_snapshot),
            lineTotal: safeNum(order.unit_price_snapshot) * (safeNum(order.quantity) || 1),
          }
        ],
        shippingType: order.shipping_type || "Standard",
        shippingCharge: safeNum(order.shipping_charge_snapshot),
        giftBox: order.gift_box === true,
        giftBoxFee: safeNum(order.gift_box_fee),
        bargainApplied: safeNum(order.bargain_discount) > 0,
        bargainDiscount: safeNum(order.bargain_discount),
        bargainFinalPrice: order.bargain_final_price ? safeNum(order.bargain_final_price) : null,
        subtotal: safeNum(order.subtotal),
        taxAmount: safeNum(order.tax_amount),
        total: safeNum(order.total),
        customer: {
          email: order.customer_email || "",
          firstName: order.customer_first_name || "",
          lastName: order.customer_last_name || "",
          fullName: `${order.customer_first_name || ""} ${order.customer_last_name || ""}`.trim(),
          province: order.customer_province || "",
          city: order.customer_city || "",
          address: order.customer_address || "",
          phone: order.customer_phone || "",
        },
        status: order.status,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
    });

  } catch (error) {
    console.error("getMyOrderById ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};
