const { Order, BuyNowSession, User, Product, ProductImage, OrderItem } = require("../models");
const { Op } = require("sequelize");
const stockService = require("../services/inventory/stockService");

function getBaseUrl(req) {
  const envUrl = process.env.BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const protocol = (req.protocol || "http").replace(/:$/, "");
  const host = req.get("host") || "localhost:5000";
  return `${protocol}://${host}`;
}

function normalizeImagePath(imagePath) {
  if (!imagePath) return null;
  let normalized = String(imagePath).replace(/\\/g, "/");
  
  // If it's already a full URL, extract just the path
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    try {
      const url = new URL(normalized);
      normalized = url.pathname; // Get just the path part (e.g., /uploads/xxx.avif)
    } catch (e) {
      // If URL parsing fails, continue with the string
    }
  }
  
  // Ensure it starts with /uploads
  if (!normalized.startsWith("/uploads")) {
    normalized = `/uploads/${normalized.replace(/^\//, "")}`;
  }
  return normalized;
}

function buildImageUrl(req, imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const baseUrl = getBaseUrl(req);
  const normalized = normalizeImagePath(imagePath);
  if (!normalized) return null;
  return `${baseUrl}${normalized}`;
}

async function resolveProductImage(req, productId, snapshotImage) {
  // If snapshot image exists, use it
  if (snapshotImage) {
    // Check if it's already a full URL
    if (snapshotImage.startsWith("http://") || snapshotImage.startsWith("https://")) {
      return snapshotImage;
    }
    return buildImageUrl(req, snapshotImage);
  }

  // Fallback: fetch from database
  if (!productId) {
    return null;
  }

  const imageRecord = await ProductImage.findOne({
    where: { product_id: productId },
    order: [["id", "ASC"]],
    attributes: ["image_url"],
  });

  if (!imageRecord?.image_url) {
    return null;
  }

  return buildImageUrl(req, imageRecord.image_url);
}

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
      additionalItems, // Additional cart items for multi-item checkout
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

    // Build list of all items (session item + additional cart items)
    const allItems = [];
    
    // Check if we have additional items from cart checkout
    const hasAdditionalItems = Array.isArray(additionalItems) && additionalItems.length > 0;
    
    if (hasAdditionalItems) {
      // Use additional items as the full list (already includes all products)
      for (const item of additionalItems) {
        allItems.push({
          productId: item.id,
          productName: item.name || "Unknown Product",
          productImage: item.image || null,
          selectedSize: item.selectedSizes?.join(",") || item.selectedSize || null,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.price) || 0,
        });
      }
    } else {
      // Single item from session
      allItems.push({
        productId: sessionData.product_id,
        productName: sessionData.product_name,
        productImage: sessionData.product_image,
        selectedSize: sessionData.selected_size,
        quantity: Number(sessionData.quantity) || 1,
        unitPrice: Number(sessionData.unit_price) || 0,
      });
    }

    // Calculate totals from all items
    let subtotal = 0;
    let totalQuantity = 0;
    for (const item of allItems) {
      subtotal += item.unitPrice * item.quantity;
      totalQuantity += item.quantity;
    }

    const safeShippingCharge = Number(shippingCharge) || 0;
    const safeBargainDiscount = Math.min(Number(bargainDiscount) || 0, subtotal * 0.10); // Max 10%
    const giftBoxFee = giftBox ? GIFT_BOX_FEE : 0;
    const taxAmount = 0; // For future use

    const total = subtotal - safeBargainDiscount + safeShippingCharge + giftBoxFee + taxAmount;

    // Create order with PENDING_CONFIRMATION status (not finalized yet)
    // Use first item's data for backwards compatibility with order table's single-product fields
    const primaryItem = allItems[0];
    const order = await Order.create({
      session_id: sessionId,
      user_id: userId,
      product_id: primaryItem.productId,
      product_name: primaryItem.productName,
      product_image: primaryItem.productImage,
      selected_size: primaryItem.selectedSize,
      quantity: totalQuantity,
      unit_price_snapshot: primaryItem.unitPrice,
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

    // Create OrderItem entries for each product
    for (const item of allItems) {
      await OrderItem.create({
        order_id: order.id,
        product_id: item.productId,
        product_name_snapshot: item.productName,
        product_image_snapshot: item.productImage,
        size: item.selectedSize,
        quantity: item.quantity,
        unit_price_snapshot: item.unitPrice,
        line_total_snapshot: item.unitPrice * item.quantity,
      });
    }

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
        itemCount: allItems.length,
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
        { model: OrderItem, as: "items", required: false },
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

    // Build items array from OrderItems if available, otherwise fallback to order's single product
    let items = [];
    if (order.items && order.items.length > 0) {
      // Use OrderItem entries
      items = await Promise.all(order.items.map(async (item) => ({
        productId: item.product_id,
        productName: item.product_name_snapshot || "Unknown Product",
        productImage: await resolveProductImage(req, item.product_id, item.product_image_snapshot),
        selectedSize: item.size || null,
        quantity: safeNum(item.quantity) || 1,
        unitPrice: safeNum(item.unit_price_snapshot),
        lineTotal: safeNum(item.line_total_snapshot),
      })));
    } else {
      // Fallback to single product from order table (backwards compatibility)
      items = [
        {
          productId: order.product_id,
          productName: order.product_name || "Unknown Product",
          productImage: await resolveProductImage(req, order.product_id, order.product_image),
          selectedSize: order.selected_size || null,
          quantity: safeNum(order.quantity) || 1,
          unitPrice: safeNum(order.unit_price_snapshot),
          lineTotal: safeNum(order.unit_price_snapshot) * (safeNum(order.quantity) || 1),
        },
      ];
    }

    // Build response with proper numeric values and full image URLs
    return res.json({
      success: true,
      order: {
        id: order.id,
        sessionId: order.session_id,
        // Product details - now supports multiple items
        items: items,
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
   - Validates stock before confirmation
   - Decreases stock atomically on success
============================================================ */
exports.confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId, {
      include: [
        { model: BuyNowSession, required: false },
        { model: OrderItem, as: "items", required: false },
      ],
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

    // Build list of items to check/update stock
    let itemsToProcess = [];
    if (order.items && order.items.length > 0) {
      // Use OrderItem entries
      itemsToProcess = order.items.map(item => ({
        productId: item.product_id,
        quantity: item.quantity || 1,
        productName: item.product_name_snapshot,
      }));
    } else {
      // Fallback to single product from order table
      itemsToProcess = [{
        productId: order.product_id,
        quantity: order.quantity || 1,
        productName: order.product_name,
      }];
    }

    // ✅ STOCK VALIDATION: Check stock availability for ALL items before confirming
    for (const item of itemsToProcess) {
      const stockCheck = await stockService.checkStock(item.productId, item.quantity);
      
      if (!stockCheck.available) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.productName}". ${stockCheck.message}`,
          availableQty: stockCheck.availableQty,
          requestedQty: stockCheck.requestedQty,
          code: "INSUFFICIENT_STOCK",
        });
      }
    }

    // ✅ STOCK DECREASE: Atomically decrease stock for ALL items
    const stockResults = [];
    for (const item of itemsToProcess) {
      const stockResult = await stockService.decreaseStock(item.productId, item.quantity);
      
      if (!stockResult.success) {
        // If any item fails, we should ideally rollback previous decreases
        // For simplicity, return error (in production, use transactions)
        return res.status(400).json({
          success: false,
          message: `Failed to update stock for "${item.productName}". ${stockResult.message}`,
          availableQty: stockResult.availableQty,
          requestedQty: stockResult.requestedQty,
          code: "INSUFFICIENT_STOCK",
        });
      }
      stockResults.push(stockResult);
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
        itemCount: itemsToProcess.length,
      },
      stockUpdates: stockResults.map(r => ({
        productId: r.productId,
        previousStock: r.previousStock,
        newStock: r.newStock,
      })),
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

      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        order: [["created_at", "DESC"]],
        limit: Number(limit),
        offset,
      });

      const orderResponses = await Promise.all(
        orders.map(async (o) => ({
          id: o.id,
          productId: o.product_id,
          productName: o.product_name,
          productImage: await resolveProductImage(req, o.product_id, o.product_image),
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
        }))
      );

      return res.json({
        success: true,
        orders: orderResponses,
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
      include: [
        { model: BuyNowSession, required: false },
        { model: OrderItem, as: "items", required: false },
      ],
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

    // Build items array from OrderItems if available, otherwise fallback to order's single product
    let items = [];
    if (order.items && order.items.length > 0) {
      // Use OrderItem entries
      items = await Promise.all(order.items.map(async (item) => ({
        productId: item.product_id,
        productName: item.product_name_snapshot || "Unknown Product",
        productImage: await resolveProductImage(req, item.product_id, item.product_image_snapshot),
        selectedSize: item.size || null,
        quantity: safeNum(item.quantity) || 1,
        unitPrice: safeNum(item.unit_price_snapshot),
        lineTotal: safeNum(item.line_total_snapshot),
      })));
    } else {
      // Fallback to single product from order table (backwards compatibility)
      items = [
        {
          productId: order.product_id,
          productName: order.product_name || "Unknown Product",
          productImage: await resolveProductImage(req, order.product_id, order.product_image),
          selectedSize: order.selected_size || null,
          quantity: safeNum(order.quantity) || 1,
          unitPrice: safeNum(order.unit_price_snapshot),
          lineTotal: safeNum(order.unit_price_snapshot) * (safeNum(order.quantity) || 1),
        },
      ];
    }

    return res.json({
      success: true,
      order: {
        id: order.id,
        sessionId: order.session_id,
        items: items,
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
