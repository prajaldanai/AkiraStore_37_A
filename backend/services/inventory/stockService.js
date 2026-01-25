/**
 * Stock Service
 * Handles all stock-related business logic
 * Single source of truth: Product.stock (or ProductSize.stock if sizes are used)
 */

const { Op } = require("sequelize");
const sequelize = require("../../database/sequelize");
const { Product, ProductSize, ProductImage, Category } = require("../../models");

/* ============================================================
   GET INVENTORY LIST
   Returns products with stock info, filters by category, status, search
============================================================ */
exports.getInventoryList = async ({ category, stockStatus, search, page = 1, limit = 20 }) => {
  const offset = (Number(page) - 1) * Number(limit);
  
  // Build where clause for Product
  const where = {};
  
  // Category filter
  if (category) {
    // Find category by slug or id
    const categoryRecord = await Category.findOne({
      where: {
        [Op.or]: [
          { slug: category },
          { id: isNaN(category) ? null : Number(category) },
        ],
      },
    });
    
    if (categoryRecord) {
      where.category_id = categoryRecord.id;
    }
  }
  
  // Search filter (by product name)
  if (search && search.trim()) {
    where.name = { [Op.iLike]: `%${search.trim()}%` };
  }

  // Fetch products with images and sizes
  const { count, rows: products } = await Product.findAndCountAll({
    where,
    include: [
      { model: ProductImage, attributes: ["id", "image_url"] },
      { model: ProductSize, attributes: ["id", "size_text"] },
      { model: Category, attributes: ["id", "name", "slug"] },
    ],
    order: [["id", "DESC"]],
    limit: Number(limit),
    offset,
  });

  // Process products and apply stock status filter
  let processedProducts = products.map((p) => {
    // Calculate total stock
    // If sizes exist and have stock, sum them. Otherwise use Product.stock
    const sizes = p.ProductSizes || [];
    
    // For now, use Product.stock as main stock (sizes don't have stock field based on model)
    const totalStock = p.stock || 0;
    
    // Determine stock status
    let stockStatusValue = "in_stock";
    if (totalStock === 0) {
      stockStatusValue = "out_of_stock";
    } else if (totalStock <= 5) {
      stockStatusValue = "low_stock";
    }
    
    // Get first image
    const images = (p.ProductImages || [])
      .map((i) => i.image_url)
      .filter(Boolean)
      .map((i) => i.replace(/\\/g, "/"))
      .map((i) => (i.startsWith("/uploads") ? i : "/uploads/" + i));
    
    return {
      id: p.id,
      name: p.name,
      category: p.Category ? {
        id: p.Category.id,
        name: p.Category.name,
        slug: p.Category.slug,
      } : null,
      price: p.price,
      stock: totalStock,
      stockStatus: stockStatusValue,
      image: images[0] || null,
      images: images,
      sizes: sizes.map((s) => ({
        id: s.id,
        sizeText: s.size_text,
      })),
    };
  });

  // Apply stock status filter (after processing)
  if (stockStatus) {
    const statusMap = {
      in_stock: "in_stock",
      low_stock: "low_stock",
      out_of_stock: "out_of_stock",
    };
    
    const targetStatus = statusMap[stockStatus.toLowerCase()];
    if (targetStatus) {
      processedProducts = processedProducts.filter((p) => p.stockStatus === targetStatus);
    }
  }

  return {
    products: processedProducts,
    pagination: {
      total: stockStatus ? processedProducts.length : count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil((stockStatus ? processedProducts.length : count) / Number(limit)),
    },
  };
};

/* ============================================================
   ADJUST STOCK (INCREASE/DECREASE)
   delta: +1 or -1 (or any integer)
   Prevents going below 0
============================================================ */
exports.adjustStock = async (productId, delta) => {
  // Use transaction for race-condition safety
  const transaction = await sequelize.transaction();
  
  try {
    // Lock the row for update
    const product = await Product.findByPk(productId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    
    if (!product) {
      await transaction.rollback();
      return { success: false, message: "Product not found" };
    }
    
    const currentStock = product.stock || 0;
    const newStock = currentStock + delta;
    
    // Prevent negative stock
    if (newStock < 0) {
      await transaction.rollback();
      return { 
        success: false, 
        message: "Cannot reduce stock below 0",
        currentStock,
      };
    }
    
    // Update stock
    await product.update({ stock: newStock }, { transaction });
    await transaction.commit();
    
    // Determine new stock status
    let stockStatus = "in_stock";
    if (newStock === 0) {
      stockStatus = "out_of_stock";
    } else if (newStock <= 5) {
      stockStatus = "low_stock";
    }
    
    return {
      success: true,
      productId: product.id,
      previousStock: currentStock,
      newStock,
      stockStatus,
    };
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/* ============================================================
   CHECK STOCK AVAILABILITY
   Returns true if stock >= quantity requested
============================================================ */
exports.checkStock = async (productId, quantity, sizeId = null) => {
  const product = await Product.findByPk(productId);
  
  if (!product) {
    return { available: false, message: "Product not found" };
  }
  
  const currentStock = product.stock || 0;
  
  if (currentStock < quantity) {
    return {
      available: false,
      message: `Insufficient stock. Only ${currentStock} item(s) available.`,
      requestedQty: quantity,
      availableQty: currentStock,
    };
  }
  
  return {
    available: true,
    requestedQty: quantity,
    availableQty: currentStock,
  };
};

/* ============================================================
   DECREASE STOCK (FOR ORDER PLACEMENT)
   Race-condition safe: only succeeds if stock >= quantity
============================================================ */
exports.decreaseStock = async (productId, quantity, sizeId = null) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Lock the row and check stock atomically
    const product = await Product.findByPk(productId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    
    if (!product) {
      await transaction.rollback();
      return { success: false, message: "Product not found" };
    }
    
    const currentStock = product.stock || 0;
    
    if (currentStock < quantity) {
      await transaction.rollback();
      return {
        success: false,
        message: `Insufficient stock. Only ${currentStock} item(s) available.`,
        availableQty: currentStock,
        requestedQty: quantity,
      };
    }
    
    // Decrease stock
    const newStock = currentStock - quantity;
    await product.update({ stock: newStock }, { transaction });
    await transaction.commit();
    
    return {
      success: true,
      productId: product.id,
      previousStock: currentStock,
      newStock,
      decreasedBy: quantity,
    };
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/* ============================================================
   RESTORE STOCK (FOR ORDER CANCELLATION)
============================================================ */
exports.restoreStock = async (productId, quantity, sizeId = null) => {
  const transaction = await sequelize.transaction();
  
  try {
    const product = await Product.findByPk(productId, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    
    if (!product) {
      await transaction.rollback();
      return { success: false, message: "Product not found" };
    }
    
    const currentStock = product.stock || 0;
    const newStock = currentStock + quantity;
    
    await product.update({ stock: newStock }, { transaction });
    await transaction.commit();
    
    return {
      success: true,
      productId: product.id,
      previousStock: currentStock,
      newStock,
      restoredBy: quantity,
    };
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/* ============================================================
   GET ALL CATEGORIES (for filter dropdown)
============================================================ */
exports.getCategories = async () => {
  const categories = await Category.findAll({
    attributes: ["id", "name", "slug"],
    order: [["name", "ASC"]],
  });
  
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));
};

module.exports = exports;
