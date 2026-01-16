/**
 * Add timestamp columns to product_ratings
 */
require("dotenv").config();
const { Sequelize, QueryTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

(async () => {
  try {
    await sequelize.query(
      `ALTER TABLE product_ratings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`
    );
    await sequelize.query(
      `ALTER TABLE product_ratings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`
    );
    console.log("✅ Timestamp columns added");
    
    const cols = await sequelize.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product_ratings'`,
      { type: QueryTypes.SELECT }
    );
    console.table(cols);
  } catch (err) {
    console.log("Error:", err.message);
  } finally {
    await sequelize.close();
  }
})();
