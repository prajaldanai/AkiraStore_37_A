const express = require("express");
const router = express.Router();

const upload = require("../middlewares/uploadMiddleware");

// Controllers
const {
  addProduct,
  getProductsByCategory,
  getCategoryBySlug,   
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");


// ---------------------- CATEGORY ROUTE (REQUIRED!) ----------------------
router.get("/categories/:slug", getCategoryBySlug);


// ---------------------- PRODUCT ROUTES ----------------------

// Get all products in a category
router.get("/admin/products/category/:categoryId", getProductsByCategory);

// Get one product by ID (EDIT PAGE)
router.get("/admin/products/:id", getProductById);

// Add new product
router.post(
  "/admin/products",
  upload.array("images", 6),
  addProduct
);

// Update product
router.put(
  "/admin/products/:id",
  upload.array("images", 6),
  updateProduct
);

// Delete product
router.delete("/admin/products/:id", deleteProduct);

module.exports = router;
