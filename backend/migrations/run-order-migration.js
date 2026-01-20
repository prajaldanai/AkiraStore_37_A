/**
 * Migration Script: Add order timestamps and order_items table
 * Run with: node migrations/run-order-migration.js
 */

require("dotenv").config();
const sequelize = require("../database/sequelize");

async function runMigration() {
  console.log("🚀 Starting order migration...\n");

  try {
    // Test connection
    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    // Add new columns to orders table
    console.log("📦 Adding new columns to orders table...");
    
    const alterQueries = [
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP`,
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method_label VARCHAR(255)`,
    ];

    for (const query of alterQueries) {
      try {
        await sequelize.query(query);
        console.log(`  ✓ ${query.split("ADD COLUMN IF NOT EXISTS ")[1]?.split(" ")[0] || "done"}`);
      } catch (err) {
        // Column might already exist
        if (!err.message.includes("already exists")) {
          console.warn(`  ⚠ Warning: ${err.message}`);
        }
      }
    }

    // Create order_items table
    console.log("\n📦 Creating order_items table...");
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        product_name_snapshot VARCHAR(255) NOT NULL,
        product_image_snapshot VARCHAR(500),
        size VARCHAR(50),
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price_snapshot FLOAT NOT NULL,
        line_total_snapshot FLOAT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sequelize.query(createTableQuery);
    console.log("  ✓ order_items table created");

    // Create indexes
    console.log("\n📦 Creating indexes...");
    
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`,
      `CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)`,
    ];

    for (const query of indexQueries) {
      try {
        await sequelize.query(query);
        console.log(`  ✓ Index created`);
      } catch (err) {
        console.warn(`  ⚠ ${err.message}`);
      }
    }

    // Normalize existing status values
    console.log("\n📦 Normalizing order statuses...");
    
    await sequelize.query(`
      UPDATE orders SET status = 'PLACED' 
      WHERE UPPER(status) IN ('PENDING', 'PENDING_CONFIRMATION', 'CONFIRMED')
    `);
    
    await sequelize.query(`
      UPDATE orders SET status = UPPER(status) 
      WHERE status IS NOT NULL AND status != UPPER(status)
    `);
    
    console.log("  ✓ Statuses normalized");

    // Migrate existing orders to order_items
    console.log("\n📦 Migrating existing orders to order_items...");
    
    // First enable uuid-ossp extension if not enabled
    try {
      await sequelize.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    } catch (err) {
      // Extension might already exist or user doesn't have permission
    }
    
    const [results] = await sequelize.query(`
      INSERT INTO order_items (id, order_id, product_id, product_name_snapshot, product_image_snapshot, size, quantity, unit_price_snapshot, line_total_snapshot)
      SELECT 
        uuid_generate_v4(),
        o.id,
        o.product_id,
        o.product_name,
        o.product_image,
        o.selected_size,
        o.quantity,
        o.unit_price_snapshot,
        o.unit_price_snapshot * o.quantity
      FROM orders o
      WHERE NOT EXISTS (
        SELECT 1 FROM order_items oi WHERE oi.order_id = o.id
      )
      AND o.product_id IS NOT NULL
      RETURNING id
    `);
    
    console.log(`  ✓ Migrated ${results?.length || 0} orders to order_items`);

    // Summary
    console.log("\n📊 Summary:");
    
    const [[orderCount]] = await sequelize.query(`SELECT COUNT(*) as count FROM orders`);
    const [[itemCount]] = await sequelize.query(`SELECT COUNT(*) as count FROM order_items`);
    
    console.log(`  • Orders: ${orderCount.count}`);
    console.log(`  • Order Items: ${itemCount.count}`);

    console.log("\n✅ Migration completed successfully!");

  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
