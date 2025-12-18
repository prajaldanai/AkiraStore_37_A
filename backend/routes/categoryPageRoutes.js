const express = require("express");
const router = express.Router();
const { getCategoryPage } = require("../controllers/categoryPageController");

// Correct route: GET /api/category-page/:slug
router.get("/:slug", getCategoryPage);

module.exports = router;
