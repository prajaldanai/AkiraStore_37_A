const {
  Product,
  ProductImage,
  ShippingRule,
  BuyNowSession,
} = require("../models");

/* ============================================================
   HELPERS
============================================================ */
function normalizeImage(img) {
  if (!img) return null;
  const fixed = String(img).replace(/\\/g, "/");
  return fixed.startsWith("/uploads") ? fixed : `/uploads/${fixed}`;
}

/**
 * Format shipping options from ShippingRule into array format
 */
function formatShippingOptions(shipping) {
  if (!shipping) {
    // Default shipping options if none defined
    return [
      { id: "courier", label: "Courier Charge", description: "Standard courier delivery", amount: 100 },
      { id: "home_valley", label: "Home Delivery (Inside Valley)", description: "Door-to-door inside Kathmandu Valley", amount: 150 },
      { id: "outside_valley", label: "Outside Valley", description: "Delivery outside Kathmandu Valley", amount: 250 },
    ];
  }

  return [
    {
      id: "courier",
      label: "Courier Charge",
      description: shipping.courier_desc || "Standard courier delivery",
      amount: Number(shipping.courier_charge) || 100,
    },
    {
      id: "home_valley",
      label: "Home Delivery (Inside Valley)",
      description: shipping.home_delivery_desc || "Door-to-door inside Kathmandu Valley",
      amount: Number(shipping.home_delivery_charge) || 150,
    },
    {
      id: "outside_valley",
      label: "Outside Valley",
      description: shipping.outside_valley_desc || "Delivery outside Kathmandu Valley",
      amount: Number(shipping.outside_valley_charge) || 250,
    },
  ];
}

/* ============================================================
   CREATE BUY NOW SESSION
   POST /api/buy-now/session
============================================================ */
exports.createSession = async (req, res) => {
  try {
    const { productId, selectedSize, quantity } = req.body;
    const userId = req.user?.id || null; // From auth middleware if logged in

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    // Fetch product with shipping
    const product = await Product.findByPk(productId, {
      include: [
        { model: ProductImage, attributes: ["image_url"] },
        { model: ShippingRule },
      ],
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check stock
    const requestedQty = Number(quantity) || 1;
    if (product.stock < requestedQty) {
      return res.status(400).json({ 
        success: false, 
        message: `Not enough stock. Available: ${product.stock}` 
      });
    }

    // Format shipping options
    const shippingOptions = formatShippingOptions(product.ShippingRule);

    // Get main image
    const mainImage = product.ProductImages?.[0]?.image_url || null;

    // Create session (expires in 24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const session = await BuyNowSession.create({
      user_id: userId,
      product_id: productId,
      product_name: product.name,
      product_image: normalizeImage(mainImage),
      selected_size: Array.isArray(selectedSize) ? selectedSize.join(",") : selectedSize || null,
      quantity: requestedQty,
      unit_price: Number(product.price) || 0,
      shipping_options: shippingOptions,
      status: "active",
      expires_at: expiresAt,
    });

    return res.status(201).json({
      success: true,
      sessionId: session.id,
      session: {
        id: session.id,
        productId: session.product_id,
        productName: session.product_name,
        productImage: session.product_image,
        selectedSize: session.selected_size,
        quantity: session.quantity,
        unitPrice: session.unit_price,
        shippingOptions: session.shipping_options,
        expiresAt: session.expires_at,
      },
    });

  } catch (error) {
    console.error("createSession ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to create session" });
  }
};

/* ============================================================
   GET BUY NOW SESSION
   GET /api/buy-now/session/:sessionId
============================================================ */
exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await BuyNowSession.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Check if expired
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      await session.update({ status: "expired" });
      return res.status(410).json({ success: false, message: "Session has expired" });
    }

    // Check if already used
    if (session.status === "completed") {
      return res.status(410).json({ success: false, message: "Session already used" });
    }

    return res.json({
      success: true,
      session: {
        id: session.id,
        productId: session.product_id,
        productName: session.product_name,
        productImage: session.product_image,
        selectedSize: session.selected_size,
        quantity: session.quantity,
        unitPrice: session.unit_price,
        shippingOptions: session.shipping_options,
        expiresAt: session.expires_at,
      },
    });

  } catch (error) {
    console.error("getSession ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to get session" });
  }
};

/* ============================================================
   UPDATE SESSION (size/quantity change resets bargain)
   PUT /api/buy-now/session/:sessionId
============================================================ */
exports.updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { selectedSize, quantity } = req.body;

    const session = await BuyNowSession.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ success: false, message: "Session is no longer active" });
    }

    // Update fields
    const updates = {};
    if (selectedSize !== undefined) {
      updates.selected_size = Array.isArray(selectedSize) ? selectedSize.join(",") : selectedSize;
    }
    if (quantity !== undefined) {
      updates.quantity = Number(quantity) || 1;
    }

    await session.update(updates);

    return res.json({
      success: true,
      message: "Session updated",
      session: {
        id: session.id,
        productId: session.product_id,
        productName: session.product_name,
        productImage: session.product_image,
        selectedSize: session.selected_size,
        quantity: session.quantity,
        unitPrice: session.unit_price,
        shippingOptions: session.shipping_options,
        expiresAt: session.expires_at,
      },
    });

  } catch (error) {
    console.error("updateSession ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update session" });
  }
};
