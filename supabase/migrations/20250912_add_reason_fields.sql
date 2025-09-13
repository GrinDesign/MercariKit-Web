-- Add reason fields for hold and discard operations
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS hold_reason TEXT,
ADD COLUMN IF NOT EXISTS held_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS discard_reason TEXT;