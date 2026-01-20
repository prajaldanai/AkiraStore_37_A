/**
 * Migration: Create buy_now_sessions and orders tables
 * Run: node migrations/create-buynow-orders-tables.js
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
    logging: console.log,
  }
);

async function runMigration() {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Connected to PostgreSQL\n");

    // ==================== BUY_NOW_SESSIONS TABLE ====================
    console.log("📋 Creating buy_now_sessions table...");
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS buy_now_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        product_image VARCHAR(500),
        selected_size VARCHAR(100),
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price FLOAT NOT NULL,
        shipping_options JSONB DEFAULT '[]',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("   ✅ buy_now_sessions table created\n");

    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_buy_now_sessions_user_id ON buy_now_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_buy_now_sessions_product_id ON buy_now_sessions(product_id);
      CREATE INDEX IF NOT EXISTS idx_buy_now_sessions_status ON buy_now_sessions(status);
    `);
    console.log("   ✅ buy_now_sessions indexes created\n");

    // ==================== ORDERS TABLE ====================
    console.log("📋 Creating orders table...");
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES buy_now_sessions(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        
        product_id INTEGER NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_image VARCHAR(500),
        selected_size VARCHAR(100),
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price_snapshot FLOAT NOT NULL,
        
        shipping_type VARCHAR(100) NOT NULL,
        shipping_charge_snapshot FLOAT NOT NULL DEFAULT 0,
        
        gift_box BOOLEAN NOT NULL DEFAULT FALSE,
        gift_box_fee FLOAT NOT NULL DEFAULT 0,
        
        bargain_discount FLOAT NOT NULL DEFAULT 0,
        bargain_final_price FLOAT,
        bargain_chat_log JSONB DEFAULT '[]',
        
        tax_amount FLOAT NOT NULL DEFAULT 0,
        subtotal FLOAT NOT NULL,
        total FLOAT NOT NULL,
        
        customer_email VARCHAR(255) NOT NULL,
        customer_first_name VARCHAR(100) NOT NULL,
        customer_last_name VARCHAR(100) NOT NULL,
        customer_province VARCHAR(100) NOT NULL,
        customer_city VARCHAR(100) NOT NULL,
        customer_address TEXT NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("   ✅ orders table created\n");

    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
      CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    `);
    console.log("   ✅ orders indexes created\n");

    // ==================== VERIFY TABLES ====================
    console.log("📋 Verifying tables...\n");
    
    const tables = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('buy_now_sessions', 'orders')
      ORDER BY table_name;
    `, { type: QueryTypes.SELECT });

    console.log("Created tables:");
    tables.forEach(t => console.log(`  ✅ ${t.table_name}`));

    console.log("\n✅ Migration completed successfully!");
    console.log("🚀 You can now start the backend server.\n");

  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

runMigration();
