const { DataTypes } = require("sequelize");
const sequelize = require("../database/sequelize"); // adjust path if needed

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    security_question: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    security_answer: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    role: {
      type: DataTypes.STRING,
      defaultValue: "user",
    },

    // ========== USER STATUS FIELDS ==========
    is_blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_blocked",
    },

    blocked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "blocked_at",
    },

    block_reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "block_reason",
    },

    suspended_until: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "suspended_until",
    },

    suspension_reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "suspension_reason",
    },

    login_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "login_count",
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

/**
 * Get computed user status
 * @returns {string} - "BLOCKED" | "SUSPENDED" | "ACTIVE"
 */
User.prototype.getStatus = function () {
  if (this.is_blocked) {
    return "BLOCKED";
  }
  if (this.suspended_until && new Date(this.suspended_until) > new Date()) {
    return "SUSPENDED";
  }
  return "ACTIVE";
};

/**
 * Check if user can make purchases
 * @returns {object} - { allowed: boolean, message?: string }
 */
User.prototype.canPurchase = function () {
  if (this.is_blocked) {
    return {
      allowed: false,
      message: "Your account has been blocked. Please contact support.",
    };
  }
  if (this.suspended_until && new Date(this.suspended_until) > new Date()) {
    const suspendedDate = new Date(this.suspended_until).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return {
      allowed: false,
      message: `Your account is suspended until ${suspendedDate}. Contact support for assistance.`,
    };
  }
  return { allowed: true };
};

module.exports = User;
