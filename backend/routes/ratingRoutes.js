const express = require("express");
const router = express.Router();

const { ProductRating } = require("../models");
const { fn, col } = require("sequelize");

router.post("/add", async (req, res) => {
  try {
    const { product_id, rating } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({
        success: false,
        message: "Product ID and rating are required",
      });
    }

    // 1️⃣ Insert rating
    await ProductRating.create({
      product_id,
      rating,
    });

    // 2️⃣ Recalculate average + count
    const stats = await ProductRating.findOne({
      where: { product_id },
      attributes: [
        [fn("AVG", col("rating")), "avg"],
        [fn("COUNT", col("rating")), "total"],
      ],
      raw: true,
    });

    return res.json({
      success: true,
      newAverage: Number(stats.avg).toFixed(1),
      totalRatings: Number(stats.total),
    });

  } catch (error) {
    console.error("RATING ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit rating",
    });
  }
});

module.exports = router;
