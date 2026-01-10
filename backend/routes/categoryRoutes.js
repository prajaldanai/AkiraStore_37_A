// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();

// ✅ Import Sequelize model (NOT database/db)
const { Category } = require("../models");

/* ============================================================
   GET CATEGORY BY SLUG
   GET /api/categories/:slug
============================================================ */
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({
      where: { slug },
      attributes: ["id", "name", "slug"],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Sequelize instance → plain JSON
    res.json(category);

  } catch (err) {
    console.error("Category fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching category",
    });
  }
});

module.exports = router;
