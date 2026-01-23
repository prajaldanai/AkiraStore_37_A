/**
 * Run User Status Migration
 * Adds user management fields to the users table
 */

const sequelize = require('../database/sequelize');

async function runMigration() {
  try {
    console.log('🔄 Running user status migration...');

    // Add all columns
    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
    `);
    console.log('  ✓ Added is_blocked column');

    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;
    `);
    console.log('  ✓ Added blocked_at column');

    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS block_reason VARCHAR(500);
    `);
    console.log('  ✓ Added block_reason column');

    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE;
    `);
    console.log('  ✓ Added suspended_until column');

    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason VARCHAR(500);
    `);
    console.log('  ✓ Added suspension_reason column');

    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
    `);
    console.log('  ✓ Added login_count column');

    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('  ✓ Added created_at column');

    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('  ✓ Added updated_at column');

    // Update null login_count values
    await sequelize.query(`
      UPDATE users SET login_count = 0 WHERE login_count IS NULL;
    `);
    console.log('  ✓ Updated null login_count values');

    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_suspended_until ON users(suspended_until);
    `);
    console.log('  ✓ Created indexes');

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
