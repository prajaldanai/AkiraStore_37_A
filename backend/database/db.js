const { Pool } = require("pg");
require("dotenv").config();

// Create PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Test database connection
pool.connect()
  .then(() => {
    console.log("Connected to PostgreSQL database successfully");
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
  });

module.exports = pool;
