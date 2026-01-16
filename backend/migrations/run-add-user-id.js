/**
 * Migration script: Add user_id column to product_ratings table
 * Run: node migrations/run-add-user-id.js
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

    // Step 1: Check if column exists
    console.log("📋 Checking if user_id column exists...");
    const columns = await sequelize.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'product_ratings' AND column_name = 'user_id'`,
      { type: QueryTypes.SELECT }
    );

    if (columns.length > 0) {
      console.log("✅ user_id column already exists. No migration needed.");
    } else {
      console.log("⚠️  user_id column NOT found. Adding it now...\n");

      // Step 2: Add user_id column (nullable first)
      console.log("1️⃣  Adding user_id column (nullable)...");
      await sequelize.query(
        `ALTER TABLE product_ratings ADD COLUMN user_id INTEGER`
      );
      console.log("   ✅ Column added\n");

      // Step 3: Set default value for existing rows
      console.log("2️⃣  Setting user_id = 0 for existing rows...");
      const [, meta] = await sequelize.query(
        `UPDATE product_ratings SET user_id = 0 WHERE user_id IS NULL`
      );
      console.log(`   ✅ Updated ${meta?.rowCount || 0} rows\n`);

      // Step 4: Make column NOT NULL
      console.log("3️⃣  Making user_id NOT NULL...");
      await sequelize.query(
        `ALTER TABLE product_ratings ALTER COLUMN user_id SET NOT NULL`
      );
      console.log("   ✅ Constraint added\n");
    }

    // Step 5: Check/create unique index
    console.log("4️⃣  Checking unique index on (product_id, user_id)...");
    const indexes = await sequelize.query(
      `SELECT indexname FROM pg_indexes 
       WHERE tablename = 'product_ratings' 
       AND indexdef LIKE '%product_id%' 
       AND indexdef LIKE '%user_id%'`,
      { type: QueryTypes.SELECT }
    );

    if (indexes.length > 0) {
      console.log(`   ✅ Index already exists: ${indexes[0].indexname}\n`);
    } else {
      console.log("   ⚠️  Index not found. Creating...");
      await sequelize.query(
        `CREATE UNIQUE INDEX product_ratings_product_id_user_id 
         ON product_ratings (product_id, user_id)`
      );
      console.log("   ✅ Unique index created\n");
    }

    // Verify final state
    console.log("📋 Final table structure:");
    const finalColumns = await sequelize.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'product_ratings'
       ORDER BY ordinal_position`,
      { type: QueryTypes.SELECT }
    );
    console.table(finalColumns);

    console.log("\n✅ Migration completed successfully!");
    console.log("🚀 You can now start the backend server.");

  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    
    if (error.message.includes("already exists")) {
      console.log("\n💡 The column or index already exists. This is fine.");
    } else {
      process.exit(1);
    }
  } finally {
    await sequelize.close();
  }
}

runMigration();
