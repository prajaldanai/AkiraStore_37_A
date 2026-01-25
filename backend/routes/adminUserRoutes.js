/**
 * Admin User Routes
 * Routes for admin user management
 */

const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  suspendUser,
  unsuspendUser,
} = require("../controllers/adminUserController");

const { verifyToken, isAdmin } = require("../middlewares/authMiddleware");

// All routes require admin authentication
router.use(verifyToken, isAdmin);

// GET /api/admin/users - Get all users with stats
router.get("/", getAllUsers);

// GET /api/admin/users/:id - Get single user
router.get("/:id", getUserById);

// PATCH /api/admin/users/:id/block - Block user
router.patch("/:id/block", blockUser);

// PATCH /api/admin/users/:id/unblock - Unblock user
router.patch("/:id/unblock", unblockUser);

// PATCH /api/admin/users/:id/suspend - Suspend user for N days
router.patch("/:id/suspend", suspendUser);

// PATCH /api/admin/users/:id/unsuspend - Remove suspension
router.patch("/:id/unsuspend", unsuspendUser);

module.exports = router;
