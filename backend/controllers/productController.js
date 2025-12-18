// backend/controllers/productController.js
const { pool } = require("../database/db");
const ProductModel = require("../models/productModel");

/* ============================================================
   GET CATEGORY BY SLUG
============================================================ */
async function getCategoryBySlug(req, res) {
  const { slug } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, name, slug FROM categories WHERE slug = $1",
      [slug]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error("Error in getCategoryBySlug:", err);
    return res.status(500).json({ message: "Failed to load category" });
  }
}

/* ============================================================
   GET PRODUCTS BY CATEGORY
============================================================ */
async function getProductsByCategory(req, res) {
  try {
    const categoryId = Number(req.params.categoryId);

    if (!categoryId) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const products = await ProductModel.getProductsByCategoryId(categoryId);

    return res.json({ success: true, products });
  } catch (err) {
    console.error("Error in getProductsByCategory:", err);
    return res.status(500).json({ message: "Failed to load products" });
  }
}

/* ============================================================
   GET PRODUCT BY ID
============================================================ */
async function getProductById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await ProductModel.getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      product,
    });

  } catch (err) {
    console.error("Error in getProductById:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load product",
      error: err.message,
    });
  }
}

/* ============================================================
   ADD PRODUCT
============================================================ */
async function addProduct(req, res) {
  try {
    const imagePaths = (req.files || []).map(
      (file) => `/uploads/${file.filename}`
    );

    let features = [];
    let sizes = [];
    let shipping = null;

    try {
      if (req.body.features) features = JSON.parse(req.body.features);
      if (req.body.sizes) sizes = JSON.parse(req.body.sizes);
      if (req.body.shipping) shipping = JSON.parse(req.body.shipping);
    } catch (e) {
      console.error("Invalid JSON:", e.message);
      return res.status(400).json({ message: "Invalid JSON format" });
    }

    let categoryId;

    if (req.body.category_id) {
      categoryId = Number(req.body.category_id);
    } else {
      const slug = req.body.categorySlug;

      const cat = await pool.query(
        "SELECT id FROM categories WHERE slug = $1",
        [slug]
      );

      if (cat.rowCount === 0) {
        return res.status(400).json({ message: "Invalid category slug" });
      }

      categoryId = cat.rows[0].id;
    }

    const productId = await ProductModel.createProduct({
      ...req.body,
      category_id: categoryId,
      images: imagePaths,
      features,
      sizes,
      shipping,
    });

    res.status(201).json({ success: true, productId });

  } catch (err) {
    console.error("Error in addProduct:", err);
    return res.status(500).json({ message: "Failed to create product" });
  }
}

/* ============================================================
   UPDATE PRODUCT  — FINAL FIXED VERSION
============================================================ */
async function updateProduct(req, res) {
  try {
    const id = Number(req.params.id);

    const existing = await ProductModel.getProductById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let newFeatures = existing.features;
    let newSizes = existing.sizes;
    let newShipping = existing.shipping;

    let existingImages = existing.images;

    /* -------------------------------
       Parse JSON fields from FormData
    -------------------------------- */
    try {
      if (req.body.features) newFeatures = JSON.parse(req.body.features);
      if (req.body.sizes) newSizes = JSON.parse(req.body.sizes);
      if (req.body.shipping) newShipping = JSON.parse(req.body.shipping);

      if (req.body.existingImages) {
        existingImages = JSON.parse(req.body.existingImages);
      }
    } catch (err) {
      console.error("JSON Parse Error:", err.message);
    }

    /* -------------------------------
       Handle uploaded images
    -------------------------------- */
    const uploadedImages = (req.files || []).map(
      (file) => `/uploads/${file.filename}`
    );

    // ⭐ FINAL IMAGE LOGIC: Append new images, keep existing ones
    let finalImages = existingImages;

    if (uploadedImages.length > 0) {
      finalImages = [...existingImages, ...uploadedImages];
    }

    /* -------------------------------
       Build final updated product data
    -------------------------------- */
    const updatedData = {
      name: req.body.name || existing.name,
      price: Number(req.body.price ?? existing.price),
      oldPrice: req.body.oldPrice ? Number(req.body.oldPrice) : existing.old_price,
      stock: Number(req.body.stock ?? existing.stock),
      tag: req.body.tag ?? existing.tag,
      descriptionShort: req.body.descriptionShort ?? existing.description_short,
      descriptionLong: req.body.descriptionLong ?? existing.description_long,
      exclusiveOfferEnd: req.body.exclusiveOfferEnd || existing.exclusive_offer_end,

      images: finalImages,
      features: newFeatures,
      sizes: newSizes,
      shipping: newShipping,
    };

    await ProductModel.updateProduct(id, updatedData);

    return res.json({
      success: true,
      message: "Product updated successfully",
    });

  } catch (err) {
    console.error("updateProduct ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
}

/* ============================================================
   DELETE PRODUCT
============================================================ */
async function deleteProduct(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const deleted = await ProductModel.deleteProduct(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found or already deleted",
      });
    }

    return res.json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (err) {
    console.error("Error in deleteProduct:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: err.message,
    });
  }
}

/* ============================================================
   EXPORTS
============================================================ */
module.exports = {
  addProduct,
  getProductsByCategory,
  getCategoryBySlug,
  getProductById,
  updateProduct,
  deleteProduct,
};
