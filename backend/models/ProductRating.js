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

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "product_ratings",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["product_id", "user_id"], // One rating per user per product
      },
    ],
  }
);

module.exports = ProductRating;
