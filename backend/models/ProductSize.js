const { DataTypes } = require("sequelize");
const sequelize = require("../database/sequelize");

const ProductSize = sequelize.define(
  "ProductSize",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    size_text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "product_sizes",
    timestamps: false,
  }
);

module.exports = ProductSize;
