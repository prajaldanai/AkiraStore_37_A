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
  deleteProduct,
  subscribeProductUpdates // ✅ REQUIRED
} = require("../controllers/productController");

// ---------------------- LIVE PRODUCT STREAM (SSE) ----------------------
router.get("/products/subscribe", subscribeProductUpdates);

// ---------------------- CATEGORY ROUTE ----------------------
router.get("/categories/:slug", getCategoryBySlug);

// ---------------------- ADMIN PRODUCT ROUTES ----------------------

// Get all products in a category (ADMIN)
router.get("/admin/products/category/:categoryId", getProductsByCategory);


// USER: Get one product by ID (public details)
const userProductController = require("../controllers/userProductController");
router.get("/products/:id", userProductController.getProductDetails);

// Get one product by ID (ADMIN EDIT)
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
