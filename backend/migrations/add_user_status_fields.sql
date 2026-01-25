-- Migration: Add user status fields for Admin User Management
-- Run this SQL in your PostgreSQL database before restarting the server

-- Add isBlocked field (boolean, default false)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- Add blockedAt field (timestamp, nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;

-- Add blockReason field (string, nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS block_reason VARCHAR(500);

-- Add suspendedUntil field (timestamp, nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE;

-- Add suspensionReason field (string, nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason VARCHAR(500);

-- Add loginCount field (integer, default 0)
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Add createdAt field (timestamp, for join date tracking)
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt field (timestamp)
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);
CREATE INDEX IF NOT EXISTS idx_users_suspended_until ON users(suspended_until);

-- Update existing users to have login_count = 0 if null
UPDATE users SET login_count = 0 WHERE login_count IS NULL;

-- Success message
SELECT 'Migration completed: User status fields added successfully' AS result;
