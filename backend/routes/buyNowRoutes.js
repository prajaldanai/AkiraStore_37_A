const express = require("express");
const router = express.Router();

const {
  createSession,
  getSession,
  updateSession,
} = require("../controllers/buyNowController");

const { optionalAuth } = require("../middlewares/authMiddleware");
const { enforceUserStatus } = require("../middlewares/enforceUserStatus");

// Create a new Buy Now session (snapshots product data)
// POST /api/buy-now/session
// Apply enforceUserStatus to prevent blocked/suspended users from starting buy now
router.post("/session", optionalAuth, enforceUserStatus, createSession);

// Get session by ID
// GET /api/buy-now/session/:sessionId
router.get("/session/:sessionId", getSession);

// Update session (size/quantity changes)
// PUT /api/buy-now/session/:sessionId
router.put("/session/:sessionId", optionalAuth, updateSession);

module.exports = router;
