-- Migration: Add user_id column to product_ratings table
-- Run this BEFORE starting the backend server

-- Step 1: Add user_id column (nullable first to handle existing rows)
ALTER TABLE product_ratings 
ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Step 2: Set default value for existing rows (use 0 or a placeholder)
-- You may want to delete old ratings or assign them to a specific user
UPDATE product_ratings 
SET user_id = 0 
WHERE user_id IS NULL;

-- Step 3: Make user_id NOT NULL after setting defaults
ALTER TABLE product_ratings 
ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Create unique index (if not exists)
-- This ensures one rating per user per product
CREATE UNIQUE INDEX IF NOT EXISTS product_ratings_product_id_user_id 
ON product_ratings (product_id, user_id);

-- Step 5: Optionally clean up placeholder ratings
-- DELETE FROM product_ratings WHERE user_id = 0;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'product_ratings';
