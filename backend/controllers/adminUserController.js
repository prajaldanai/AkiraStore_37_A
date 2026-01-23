/**
 * Admin User Controller
 * Handles admin user management endpoints
 */

const adminUserService = require("../services/admin/adminUserService");

/**
 * GET /api/admin/users
 * Get all users with stats
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;

    const result = await adminUserService.getAllUsers({
      search,
      status,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in getAllUsers controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/users/:id
 * Get single user details
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await adminUserService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error in getUserById controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/admin/users/:id/block
 * Block a user
 */
exports.blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await adminUserService.blockUser(id, reason);

    res.json(result);
  } catch (error) {
    console.error("Error in blockUser controller:", error);
    
    if (error.message === "User not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === "Cannot block admin users") {
      return res.status(403).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: "Failed to block user",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/admin/users/:id/unblock
 * Unblock a user
 */
exports.unblockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await adminUserService.unblockUser(id);

    res.json(result);
  } catch (error) {
    console.error("Error in unblockUser controller:", error);
    
    if (error.message === "User not found") {
      return res.status(404).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: "Failed to unblock user",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/admin/users/:id/suspend
 * Suspend a user for N days
 */
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { days, reason } = req.body;

    if (!days) {
      return res.status(400).json({
        success: false,
        message: "Suspension days is required",
      });
    }

    const result = await adminUserService.suspendUser(id, parseInt(days), reason);

    res.json(result);
  } catch (error) {
    console.error("Error in suspendUser controller:", error);
    
    if (error.message === "User not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes("Cannot suspend")) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message.includes("between 1 and 365")) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: "Failed to suspend user",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/admin/users/:id/unsuspend
 * Remove user suspension
 */
exports.unsuspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await adminUserService.unsuspendUser(id);

    res.json(result);
  } catch (error) {
    console.error("Error in unsuspendUser controller:", error);
    
    if (error.message === "User not found") {
      return res.status(404).json({ success: false, message: error.message });
    }

    res.status(500).json({
      success: false,
      message: "Failed to unsuspend user",
      error: error.message,
    });
  }
};
