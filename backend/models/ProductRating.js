const { DataTypes } = require("sequelize");
const sequelize = require("../database/sequelize");

const ProductRating = sequelize.define(
  "ProductRating",
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

    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "product_ratings",
    timestamps: false,
  }
);

module.exports = ProductRating;
