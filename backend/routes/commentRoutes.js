const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const {
  getProductComments,
  addComment,
  deleteComment,
} = require("../controllers/commentController");

/* ============================================================
   COMMENT ROUTES
============================================================ */

// Get all comments for a product (PUBLIC)
router.get("/product/:productId", getProductComments);

// Add a new comment (REQUIRES AUTH)
router.post("/", verifyToken, addComment);

// Delete a comment (REQUIRES AUTH - owner or admin)
router.delete("/:id", verifyToken, deleteComment);

module.exports = router;
