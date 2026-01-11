const { DataTypes } = require("sequelize");
const sequelize = require("../database/sequelize");

const ProductFeature = sequelize.define("ProductFeature", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: DataTypes.INTEGER,
  feature_text: DataTypes.STRING,
}, {
  tableName: "product_features",
  timestamps: false,
});

module.exports = ProductFeature;
