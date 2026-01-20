const express = require("express");
const router = express.Router();

const {
  createSession,
  getSession,
  updateSession,
} = require("../controllers/buyNowController");

const { optionalAuth } = require("../middlewares/authMiddleware");

// Create a new Buy Now session (snapshots product data)
// POST /api/buy-now/session
router.post("/session", optionalAuth, createSession);

// Get session by ID
// GET /api/buy-now/session/:sessionId
router.get("/session/:sessionId", getSession);

// Update session (size/quantity changes)
// PUT /api/buy-now/session/:sessionId
router.put("/session/:sessionId", optionalAuth, updateSession);

module.exports = router;
