const express = require("express");
const router = express.Router();

const { ProductRating } = require("../models");
const { verifyToken } = require("../middlewares/authMiddleware");
const { fn, col } = require("sequelize");

/* ============================================================
   GET RATING STATS FOR A PRODUCT (PUBLIC)
   Returns: avg_rating, rating_count, and user's own rating if logged in
============================================================ */
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    // Get overall stats
    const stats = await ProductRating.findOne({
      where: { product_id: productId },
      attributes: [
        [fn("COALESCE", fn("AVG", col("rating")), 0), "avg_rating"],
        [fn("COUNT", col("id")), "rating_count"],
      ],
      raw: true,
    });

    // Check if user is logged in and has rated
    let userRating = null;
    const authHeader = req.headers["authorization"];
    if (authHeader) {
      try {
        const jwt = require("jsonwebtoken");
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // JWT payload uses 'userId', not 'id'
        const userId = decoded.userId || decoded.id;

        const existingRating = await ProductRating.findOne({
          where: { product_id: productId, user_id: userId },
          attributes: ["rating"],
        });

        if (existingRating) {
          userRating = existingRating.rating;
        }
      } catch {
        // Token invalid or expired - just don't return user rating
      }
    }

    return res.json({
      success: true,
      avg_rating: Number(stats.avg_rating) || 0,
      rating_count: Number(stats.rating_count) || 0,
      user_rating: userRating,
    });
  } catch (error) {
    console.error("GET RATING ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch rating",
    });
  }
});

/* ============================================================
   ADD OR UPDATE RATING (REQUIRES AUTH)
   - If user hasn't rated: CREATE new rating
   - If user has rated: UPDATE existing rating
============================================================ */
router.post("/add", verifyToken, async (req, res) => {
  try {
    const { product_id, rating } = req.body;
    // JWT payload uses 'userId', not 'id'
    const user_id = req.user?.userId || req.user?.id;

    // Validation
    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to rate products",
      });
    }

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const ratingValue = Number(rating);
    if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Check if user has already rated this product
    const existingRating = await ProductRating.findOne({
      where: { product_id, user_id },
    });

    let isUpdate = false;
    if (existingRating) {
      // UPDATE existing rating
      existingRating.rating = ratingValue;
      existingRating.updated_at = new Date();
      await existingRating.save();
      isUpdate = true;
    } else {
      // CREATE new rating
      await ProductRating.create({
        product_id,
        user_id,
        rating: ratingValue,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // Recalculate stats
    const stats = await ProductRating.findOne({
      where: { product_id },
      attributes: [
        [fn("COALESCE", fn("AVG", col("rating")), 0), "avg_rating"],
        [fn("COUNT", col("id")), "rating_count"],
      ],
      raw: true,
    });

    return res.json({
      success: true,
      message: isUpdate ? "Rating updated successfully" : "Rating submitted successfully",
      avg_rating: Number(stats.avg_rating) || 0,
      rating_count: Number(stats.rating_count) || 0,
      user_rating: ratingValue,
      is_update: isUpdate,
    });
  } catch (error) {
    console.error("ADD RATING ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit rating",
    });
  }
});

/* ============================================================
   DELETE USER'S RATING (REQUIRES AUTH)
============================================================ */
router.delete("/product/:productId", verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    // JWT payload uses 'userId', not 'id'
    const user_id = req.user?.userId || req.user?.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to manage ratings",
      });
    }

    const deleted = await ProductRating.destroy({
      where: { product_id: productId, user_id },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "No rating found to delete",
      });
    }

    // Recalculate stats
    const stats = await ProductRating.findOne({
      where: { product_id: productId },
      attributes: [
        [fn("COALESCE", fn("AVG", col("rating")), 0), "avg_rating"],
        [fn("COUNT", col("id")), "rating_count"],
      ],
      raw: true,
    });

    return res.json({
      success: true,
      message: "Rating deleted successfully",
      avg_rating: Number(stats.avg_rating) || 0,
      rating_count: Number(stats.rating_count) || 0,
    });
  } catch (error) {
    console.error("DELETE RATING ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete rating",
    });
  }
});

module.exports = router;
