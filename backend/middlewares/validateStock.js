/**
 * Stock Validation Middleware
 * Validates stock availability before order placement
 */

const stockService = require("../services/inventory/stockService");
const { BuyNowSession } = require("../models");

/* ============================================================
   VALIDATE STOCK MIDDLEWARE
   Use before order creation/confirmation to ensure stock is available
============================================================ */
exports.validateStock = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for stock validation",
      });
    }
    
    // Get session data to find product and quantity
    const session = await BuyNowSession.findByPk(sessionId);
    
    if (!session) {
      return res.status(400).json({
        success: false,
        message: "Invalid session",
      });
    }
    
    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Session is no longer active",
      });
    }
    
    const productId = session.product_id;
    const quantity = session.quantity || 1;
    const sizeId = session.selected_size_id || null;
    
    // Check stock availability
    const stockCheck = await stockService.checkStock(productId, quantity, sizeId);
    
    if (!stockCheck.available) {
      return res.status(400).json({
        success: false,
        message: stockCheck.message,
        availableQty: stockCheck.availableQty,
        requestedQty: stockCheck.requestedQty,
        code: "INSUFFICIENT_STOCK",
      });
    }
    
    // Stock is available, attach info to request for later use
    req.stockValidation = {
      productId,
      quantity,
      sizeId,
      availableQty: stockCheck.availableQty,
    };
    
    next();
    
  } catch (error) {
    console.error("validateStock ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Stock validation failed",
    });
  }
};

/* ============================================================
   VALIDATE STOCK FOR ORDER CONFIRMATION
   Used when user confirms a pending order
============================================================ */
exports.validateStockForConfirmation = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { Order } = require("../models");
    
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    
    // Only validate for pending_confirmation orders
    if (order.status !== "pending_confirmation") {
      return next();
    }
    
    const productId = order.product_id;
    const quantity = order.quantity || 1;
    
    // Check stock availability
    const stockCheck = await stockService.checkStock(productId, quantity);
    
    if (!stockCheck.available) {
      return res.status(400).json({
        success: false,
        message: stockCheck.message,
        availableQty: stockCheck.availableQty,
        requestedQty: stockCheck.requestedQty,
        code: "INSUFFICIENT_STOCK",
      });
    }
    
    // Stock is available, attach info to request
    req.stockValidation = {
      productId,
      quantity,
      availableQty: stockCheck.availableQty,
    };
    
    next();
    
  } catch (error) {
    console.error("validateStockForConfirmation ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Stock validation failed",
    });
  }
};

module.exports = exports;
