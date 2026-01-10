const { DataTypes } = require("sequelize");
const sequelize = require("../database/sequelize");

const ProductImage = sequelize.define("ProductImage", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: DataTypes.INTEGER,
  image_url: DataTypes.STRING,
}, {
  tableName: "product_images",
  timestamps: false,
});

module.exports = ProductImage;
