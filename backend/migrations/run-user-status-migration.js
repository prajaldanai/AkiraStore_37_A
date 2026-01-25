const sequelize = require("../database/sequelize");

async function runUserStatusMigration() {
  console.log("[MIGRATION] Running user status migration...");

  const statements = [
    {
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;`,
      desc: "is_blocked column",
    },
    {
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;`,
      desc: "blocked_at column",
    },
    {
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS block_reason VARCHAR(500);`,
      desc: "block_reason column",
    },
    {
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE;`,
      desc: "suspended_until column",
    },
    {
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason VARCHAR(500);`,
      desc: "suspension_reason column",
    },
    {
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;`,
      desc: "login_count column",
    },
    {
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`,
      desc: "created_at column",
    },
    {
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`,
      desc: "updated_at column",
    },
  ];

  for (const { sql, desc } of statements) {
    await sequelize.query(sql);
    console.log(`[MIGRATION] Added ${desc}`);
  }

  await sequelize.query(`UPDATE users SET login_count = 0 WHERE login_count IS NULL;`);
  console.log("[MIGRATION] Reset null login_count values");

  const indexes = [
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);`,
      desc: "idx_users_is_blocked",
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS idx_users_suspended_until ON users(suspended_until);`,
      desc: "idx_users_suspended_until",
    },
  ];

  for (const { sql, desc } of indexes) {
    await sequelize.query(sql);
    console.log(`[MIGRATION] Created ${desc}`);
  }

  console.log("[MIGRATION] User status migration completed");
}

async function runCliMigration() {
  try {
    await runUserStatusMigration();
    console.log("[MIGRATION] Migration finished successfully");
    process.exit(0);
  } catch (error) {
    console.error("[MIGRATION] Migration failed", error);
    process.exit(1);
  }
}

module.exports = runUserStatusMigration;

if (require.main === module) {
  runCliMigration();
}
