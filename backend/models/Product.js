const { DataTypes } = require("sequelize");
const sequelize = require("../database/sequelize");

const Product = sequelize.define("Product", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING,
  category_id: DataTypes.INTEGER,
  tag: DataTypes.STRING,
  price: DataTypes.FLOAT,
  old_price: DataTypes.FLOAT,
  stock: DataTypes.INTEGER,
  description_short: DataTypes.TEXT,
  description_long: DataTypes.TEXT,
  exclusive_offer_end: DataTypes.DATE,
}, {
  tableName: "products",
  timestamps: false,
});

module.exports = Product;
