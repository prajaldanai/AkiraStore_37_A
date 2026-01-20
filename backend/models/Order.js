const { DataTypes } = require("sequelize");
const sequelize = require("../database/sequelize");

/**
 * Order - Stores completed orders with all customer and pricing details
 */
const Order = sequelize.define("Order", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  // Reference to buy_now_session
  session_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Guest checkout
  },
  
  // Product snapshot
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
  
  // Shipping
  shipping_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  shipping_charge_snapshot: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  
  // Gift box
  gift_box: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  gift_box_fee: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  
  // Bargain
  bargain_discount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  bargain_final_price: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  bargain_chat_log: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
  },
  
  // Tax (for future use)
  tax_amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  
  // Total
  subtotal: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  
  // Customer details
  customer_email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customer_first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customer_last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customer_province: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customer_city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customer_address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  customer_phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  
  // Order status: PLACED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "PLACED",
  },
  
  // Shipping method label for display (e.g. "Inside Valley - Rs 50")
  shipping_method_label: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  // Status timestamps for timeline tracking
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  shipped_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: "orders",
  timestamps: false,
  indexes: [
    { fields: ["user_id"] },
    { fields: ["product_id"] },
    { fields: ["session_id"] },
    { fields: ["status"] },
    { fields: ["created_at"] },
  ],
});

module.exports = Order;
