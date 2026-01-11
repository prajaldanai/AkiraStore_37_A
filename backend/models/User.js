const { DataTypes } = require("sequelize");
const sequelize = require("../database/sequelize"); // adjust path if needed

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    security_question: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    security_answer: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    role: {
      type: DataTypes.STRING,
      defaultValue: "user",
    },
  },
  {
    tableName: "users",
    timestamps: false, // set true only if you have createdAt/updatedAt
  }
);

module.exports = User;
