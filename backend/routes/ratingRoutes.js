const express = require("express");
const router = express.Router();

// ✅ FIX: Use pool instead of db
const { pool } = require("../database/db");

router.post("/add", async (req, res) => {
  try {
    const { product_id, rating } = req.body;

    // Insert rating into DB
    await pool.query(
      "INSERT INTO product_ratings (product_id, rating) VALUES ($1, $2)",
      [product_id, rating]
    );

    // Recalculate average + total ratings
    const avgData = await pool.query(
      "SELECT AVG(rating) AS avg, COUNT(*) AS total FROM product_ratings WHERE product_id = $1",
      [product_id]
    );

    return res.json({
      success: true,
      newAverage: Number(avgData.rows[0].avg).toFixed(1),
      totalRatings: avgData.rows[0].total
    });

  } catch (error) {
    console.error("RATING ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit rating"
    });
  }
});

module.exports = router;
