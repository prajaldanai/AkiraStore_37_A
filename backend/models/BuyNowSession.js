const { DataTypes } = require("sequelize");
const sequelize = require("../database/sequelize");

/**
 * BuyNowSession - Snapshots product data when user clicks "Buy Now"
 * Independent from Cart logic
 */
const BuyNowSession = sequelize.define("BuyNowSession", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Guest checkout allowed
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  product_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  product_image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  selected_size: {
    type: DataTypes.STRING,
    allowNull: true, // Comma-separated if multiple
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  unit_price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  // Shipping options snapshot (JSON)
  shipping_options: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
  },
  // Session status: active, completed, expired
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "active",
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "buy_now_sessions",
  timestamps: false,
  indexes: [
    { fields: ["user_id"] },
    { fields: ["product_id"] },
    { fields: ["status"] },
  ],
});

module.exports = BuyNowSession;
