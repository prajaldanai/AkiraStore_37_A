-- Migration: Add status timestamps and shipping_method_label to orders table
-- Run this in your PostgreSQL database

-- Add new timestamp columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

-- Add shipping method label
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method_label VARCHAR(255);

-- Update existing orders to normalize status values
UPDATE orders SET status = 'PLACED' WHERE UPPER(status) IN ('PENDING', 'PENDING_CONFIRMATION', 'CONFIRMED');
UPDATE orders SET status = UPPER(status) WHERE status IS NOT NULL;

-- Create order_items table if it doesn't exist
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
);

-- Add indexes for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Optionally migrate existing single-product orders to order_items
-- This creates order_items entries for orders that don't have any items yet
INSERT INTO order_items (order_id, product_id, product_name_snapshot, product_image_snapshot, size, quantity, unit_price_snapshot, line_total_snapshot)
SELECT 
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
AND o.product_id IS NOT NULL;

-- Verify the migration
SELECT 
  'orders' as table_name, 
  COUNT(*) as row_count 
FROM orders
UNION ALL
SELECT 
  'order_items' as table_name, 
  COUNT(*) as row_count 
FROM order_items;
