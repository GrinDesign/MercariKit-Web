-- Add price_input_mode field to store_purchases table
-- This field stores whether pricing is done in 'batch' or 'individual' mode for products

ALTER TABLE store_purchases 
ADD COLUMN price_input_mode TEXT DEFAULT 'individual' CHECK (price_input_mode IN ('batch', 'individual'));

-- Set default to individual for existing records
UPDATE store_purchases SET price_input_mode = 'individual' WHERE price_input_mode IS NULL;