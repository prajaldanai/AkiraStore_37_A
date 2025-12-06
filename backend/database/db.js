const { Pool } = require("pg");
require("dotenv").config();

// Create PostgreSQL Pool instance
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Function only used for initial connection test
const connectDB = async () => {
  try {
    const client = await pool.connect();   // <-- FIX: need real client
    await client.query("SELECT NOW()");
    console.log("Connected to PostgreSQL database successfully");
    client.release();                      // <-- release client back to pool
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
};

// Export BOTH pool and connectDB
module.exports = { pool, connectDB };
