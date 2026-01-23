/**
 * Inventory Controller
 * Handles admin inventory management endpoints
 */

const stockService = require("../services/inventory/stockService");

/* ============================================================
   GET INVENTORY LIST
   GET /api/admin/inventory
   Query params: category, stockStatus, search, page, limit
============================================================ */
exports.getInventory = async (req, res) => {
  try {
    const { category, stockStatus, search, page = 1, limit = 20 } = req.query;
    
    const result = await stockService.getInventoryList({
      category,
      stockStatus,
      search,
      page,
      limit,
    });
    
    return res.json({
      success: true,
      ...result,
    });
    
  } catch (error) {
    console.error("getInventory ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
    });
  }
};

/* ============================================================
   ADJUST STOCK
   PATCH /api/admin/inventory/:productId/adjust
   Body: { delta: +1 or -1 }
============================================================ */
exports.adjustStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { delta } = req.body;
    
    // Validate delta
    if (typeof delta !== "number" || !Number.isInteger(delta)) {
      return res.status(400).json({
        success: false,
        message: "Delta must be an integer (e.g., +1 or -1)",
      });
    }
    
    // Limit delta range for safety
    if (Math.abs(delta) > 100) {
      return res.status(400).json({
        success: false,
        message: "Delta too large. Max adjustment is ±100 per request.",
      });
    }
    
    const result = await stockService.adjustStock(Number(productId), delta);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.json({
      success: true,
      message: delta > 0 ? "Stock increased" : "Stock decreased",
      ...result,
    });
    
  } catch (error) {
    console.error("adjustStock ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to adjust stock",
    });
  }
};

/* ============================================================
   GET CATEGORIES FOR FILTER
   GET /api/admin/inventory/categories
============================================================ */
exports.getCategories = async (req, res) => {
  try {
    const categories = await stockService.getCategories();
    
    return res.json({
      success: true,
      categories,
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
   GET SINGLE PRODUCT STOCK INFO
   GET /api/admin/inventory/:productId
============================================================ */
exports.getProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const result = await stockService.getInventoryList({
      page: 1,
      limit: 1,
    });
    
    // Find the specific product
    const products = result.products || [];
    const product = products.find((p) => p.id === Number(productId));
    
    if (!product) {
      // Try fetching directly
      const { Product, ProductImage, Category } = require("../models");
      const p = await Product.findByPk(productId, {
        include: [
          { model: ProductImage, attributes: ["id", "image_url"] },
          { model: Category, attributes: ["id", "name", "slug"] },
        ],
      });
      
      if (!p) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
      
      const stock = p.stock || 0;
      let stockStatus = "in_stock";
      if (stock === 0) stockStatus = "out_of_stock";
      else if (stock <= 5) stockStatus = "low_stock";
      
      return res.json({
        success: true,
        product: {
          id: p.id,
          name: p.name,
          stock,
          stockStatus,
          category: p.Category ? { id: p.Category.id, name: p.Category.name } : null,
        },
      });
    }
    
    return res.json({
      success: true,
      product,
    });
    
  } catch (error) {
    console.error("getProductStock ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product stock",
    });
  }
};

module.exports = exports;
