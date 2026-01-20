const { DataTypes } = require("sequelize");
const sequelize = require("../database/sequelize");

/**
 * OrderItem - Individual items within an order
 * Contains product snapshot data at time of purchase
 */
const OrderItem = sequelize.define("OrderItem", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "orders",
      key: "id",
    },
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Snapshot fields (frozen at time of order)
  product_name_snapshot: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  product_image_snapshot: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  size: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  unit_price_snapshot: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  line_total_snapshot: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "order_items",
  timestamps: false,
  indexes: [
    { fields: ["order_id"] },
    { fields: ["product_id"] },
  ],
});

module.exports = OrderItem;
