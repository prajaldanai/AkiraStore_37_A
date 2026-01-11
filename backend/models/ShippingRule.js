const { DataTypes } = require("sequelize");
const sequelize = require("../database/sequelize");

const ShippingRule = sequelize.define("ShippingRule", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: DataTypes.INTEGER,
  courier_charge: DataTypes.FLOAT,
  courier_desc: DataTypes.STRING,
  home_delivery_charge: DataTypes.FLOAT,
  home_delivery_desc: DataTypes.STRING,
  outside_valley_charge: DataTypes.FLOAT,
  outside_valley_desc: DataTypes.STRING,
}, {
  tableName: "shipping_rules",
  timestamps: false,
});

module.exports = ShippingRule;
