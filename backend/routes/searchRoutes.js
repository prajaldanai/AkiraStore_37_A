/**
 * Search Routes
 * API routes for product search
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const { searchProductsHandler, getSuggestionsHandler, searchByImageHandler } = require("../controllers/searchController");
const validateSearchQuery = require("../middlewares/validateSearchQuery");

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/search"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "search-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp|avif|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});

// GET /api/search/products?q=keyword&type=quick|full
router.get("/products", validateSearchQuery, searchProductsHandler);

// GET /api/search/suggestions
router.get("/suggestions", getSuggestionsHandler);

// POST /api/search/image - Search by uploaded image
router.post("/image", upload.single("image"), searchByImageHandler);

module.exports = router;
