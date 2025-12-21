// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const { pool } = require("../database/db");

// GET category by slug
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const query = await pool.query(
      "SELECT id, name, slug FROM categories WHERE slug = $1",
      [slug]
    );

    if (query.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json(query.rows[0]); // { id, name, slug }
  } catch (err) {
    console.error("Category fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching category",
    });
  }
});

module.exports = router;
