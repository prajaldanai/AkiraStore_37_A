const express = require("express");
const router = express.Router();

const userProductController = require("../controllers/userProductController");

/* ============================================================
   USER PRODUCT ROUTES (ORDER MATTERS! DO NOT REARRANGE)
=============================================================== */

//  Latest products for homepage (men, women, kids, electronics, etc.)
router.get("/latest/:slug", userProductController.getLatestProducts);

//  View All → list products under a category
router.get("/category/:slug", userProductController.getProductsByCategorySlug);

//  Single Product Details (use /product/:id to avoid route conflicts)
router.get("/product/:id", userProductController.getProductDetails);

module.exports = router;
