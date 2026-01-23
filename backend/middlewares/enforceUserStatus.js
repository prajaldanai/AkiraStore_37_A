/**
 * Enforce User Status Middleware
 * Prevents blocked/suspended users from making purchases
 * Apply this middleware to order creation and buy now endpoints
 */

const User = require("../models/User");

/**
 * Check if user can make purchases
 * Blocks:
 *   - BLOCKED users: 403 with "account blocked" message
 *   - SUSPENDED users: 403 with "suspended until date" message
 */
const enforceUserStatus = async (req, res, next) => {
  try {
    // Only check if user is authenticated
    if (!req.user || !req.user.id) {
      // Guest checkout - allow
      return next();
    }

    // Fetch user with status fields
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "is_blocked", "block_reason", "suspended_until", "suspension_reason"],
    });

    if (!user) {
      // User not found in DB but has valid token - allow (edge case)
      return next();
    }

    // Check if blocked
    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        statusCode: "BLOCKED",
        message: "Your account has been blocked. Please contact support.",
        reason: user.block_reason || null,
      });
    }

    // Check if suspended
    if (user.suspended_until && new Date(user.suspended_until) > new Date()) {
      const suspendedDate = new Date(user.suspended_until).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      return res.status(403).json({
        success: false,
        statusCode: "SUSPENDED",
        message: `Your account is suspended until ${suspendedDate}. Contact support for assistance.`,
        suspended_until: user.suspended_until,
        reason: user.suspension_reason || null,
      });
    }

    // User is ACTIVE - allow purchase
    next();
  } catch (error) {
    console.error("Error in enforceUserStatus middleware:", error);
    // On error, allow the request (fail open) - the controller will handle any issues
    next();
  }
};

module.exports = { enforceUserStatus };
