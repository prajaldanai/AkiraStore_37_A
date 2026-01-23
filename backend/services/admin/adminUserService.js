/**
 * Admin User Service
 * Business logic for admin user management
 */

const { Op, fn, col, literal } = require("sequelize");
const User = require("../../models/User");
const { Order } = require("../../models");

/**
 * Get computed status for a user
 */
function getComputedStatus(user) {
  if (user.is_blocked) {
    return "BLOCKED";
  }
  if (user.suspended_until && new Date(user.suspended_until) > new Date()) {
    return "SUSPENDED";
  }
  return "ACTIVE";
}

/**
 * Get all users with stats
 * @param {object} options - { search, status, page, limit }
 */
async function getAllUsers({ search = "", status = "", page = 1, limit = 20 } = {}) {
  try {
    // Build where clause
    const where = {};

    // Search by username (name) or email-like pattern
    if (search) {
      where.username = { [Op.iLike]: `%${search}%` };
    }

    // Get all users first (we need to compute status)
    const allUsers = await User.findAll({
      where,
      attributes: [
        "id",
        "username",
        "role",
        "is_blocked",
        "blocked_at",
        "block_reason",
        "suspended_until",
        "suspension_reason",
        "login_count",
        "created_at",
      ],
      order: [["created_at", "DESC"]],
    });

    // Calculate stats
    let totalLogins = 0;
    let suspendedCount = 0;
    let blockedCount = 0;

    const usersWithStatus = allUsers.map((user) => {
      const status = getComputedStatus(user);
      totalLogins += user.login_count || 0;
      if (status === "SUSPENDED") suspendedCount++;
      if (status === "BLOCKED") blockedCount++;
      return { ...user.toJSON(), status };
    });

    // Filter by status if specified
    let filteredUsers = usersWithStatus;
    if (status && status !== "ALL") {
      filteredUsers = usersWithStatus.filter((u) => u.status === status.toUpperCase());
    }

    // Get orders data for each user
    const userIds = filteredUsers.map((u) => u.id);
    
    // Get order counts and total spent (delivered only)
    const orderStats = await Order.findAll({
      attributes: [
        "user_id",
        [fn("COUNT", col("id")), "totalOrders"],
        [
          fn(
            "SUM",
            literal(`CASE WHEN status = 'DELIVERED' THEN COALESCE(total, 0) ELSE 0 END`)
          ),
          "totalSpent",
        ],
      ],
      where: {
        user_id: { [Op.in]: userIds },
      },
      group: ["user_id"],
      raw: true,
    });

    // Create a map for quick lookup
    const orderStatsMap = {};
    orderStats.forEach((stat) => {
      orderStatsMap[stat.user_id] = {
        totalOrders: parseInt(stat.totalOrders) || 0,
        totalSpent: parseFloat(stat.totalSpent) || 0,
      };
    });

    // Merge order stats with users
    const usersWithOrderStats = filteredUsers.map((user) => ({
      ...user,
      totalOrders: orderStatsMap[user.id]?.totalOrders || 0,
      totalSpent: orderStatsMap[user.id]?.totalSpent || 0,
    }));

    // Pagination
    const offset = (page - 1) * limit;
    const paginatedUsers = usersWithOrderStats.slice(offset, offset + limit);

    return {
      stats: {
        totalUsers: allUsers.length,
        totalLogins,
        suspendedCount,
        blockedCount,
      },
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(filteredUsers.length / limit),
        totalCount: filteredUsers.length,
      },
    };
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw error;
  }
}

/**
 * Get single user by ID
 */
async function getUserById(userId) {
  try {
    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "username",
        "role",
        "is_blocked",
        "blocked_at",
        "block_reason",
        "suspended_until",
        "suspension_reason",
        "login_count",
        "created_at",
      ],
    });

    if (!user) {
      return null;
    }

    // Get order stats
    const orderStats = await Order.findAll({
      attributes: [
        [fn("COUNT", col("id")), "totalOrders"],
        [
          fn(
            "SUM",
            literal(`CASE WHEN status = 'DELIVERED' THEN COALESCE(grand_total, 0) ELSE 0 END`)
          ),
          "totalSpent",
        ],
      ],
      where: { user_id: userId },
      raw: true,
    });

    return {
      ...user.toJSON(),
      status: getComputedStatus(user),
      totalOrders: parseInt(orderStats[0]?.totalOrders) || 0,
      totalSpent: parseFloat(orderStats[0]?.totalSpent) || 0,
    };
  } catch (error) {
    console.error("Error in getUserById:", error);
    throw error;
  }
}

/**
 * Block a user
 */
async function blockUser(userId, reason = null) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Prevent blocking admin users
    if (user.role === "admin") {
      throw new Error("Cannot block admin users");
    }

    await user.update({
      is_blocked: true,
      blocked_at: new Date(),
      block_reason: reason,
      // Clear suspension when blocking
      suspended_until: null,
      suspension_reason: null,
    });

    return {
      success: true,
      message: "User has been blocked",
      user: {
        id: user.id,
        username: user.username,
        status: "BLOCKED",
      },
    };
  } catch (error) {
    console.error("Error in blockUser:", error);
    throw error;
  }
}

/**
 * Unblock a user
 */
async function unblockUser(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await user.update({
      is_blocked: false,
      blocked_at: null,
      block_reason: null,
    });

    return {
      success: true,
      message: "User has been unblocked",
      user: {
        id: user.id,
        username: user.username,
        status: getComputedStatus(user),
      },
    };
  } catch (error) {
    console.error("Error in unblockUser:", error);
    throw error;
  }
}

/**
 * Suspend a user for N days
 */
async function suspendUser(userId, days, reason = null) {
  try {
    if (!days || days < 1 || days > 365) {
      throw new Error("Suspension days must be between 1 and 365");
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Prevent suspending admin users
    if (user.role === "admin") {
      throw new Error("Cannot suspend admin users");
    }

    // If user is blocked, they cannot be suspended
    if (user.is_blocked) {
      throw new Error("Cannot suspend a blocked user. Unblock first.");
    }

    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + days);

    await user.update({
      suspended_until: suspendedUntil,
      suspension_reason: reason,
    });

    return {
      success: true,
      message: `User suspended for ${days} days`,
      user: {
        id: user.id,
        username: user.username,
        status: "SUSPENDED",
        suspended_until: suspendedUntil,
      },
    };
  } catch (error) {
    console.error("Error in suspendUser:", error);
    throw error;
  }
}

/**
 * Remove suspension (unsuspend)
 */
async function unsuspendUser(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await user.update({
      suspended_until: null,
      suspension_reason: null,
    });

    return {
      success: true,
      message: "User suspension has been removed",
      user: {
        id: user.id,
        username: user.username,
        status: getComputedStatus(user),
      },
    };
  } catch (error) {
    console.error("Error in unsuspendUser:", error);
    throw error;
  }
}

/**
 * Increment login count for a user
 */
async function incrementLoginCount(userId) {
  try {
    await User.increment("login_count", { where: { id: userId } });
  } catch (error) {
    console.error("Error incrementing login count:", error);
    // Don't throw - login should still succeed
  }
}

/**
 * Check if user can login (not blocked)
 */
async function checkLoginAllowed(userId) {
  try {
    const user = await User.findByPk(userId, {
      attributes: ["id", "is_blocked", "block_reason"],
    });

    if (!user) {
      return { allowed: false, message: "User not found" };
    }

    if (user.is_blocked) {
      return {
        allowed: false,
        message: "Your account has been blocked. Please contact support.",
        reason: user.block_reason,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error in checkLoginAllowed:", error);
    throw error;
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  suspendUser,
  unsuspendUser,
  incrementLoginCount,
  checkLoginAllowed,
};
