-- Optimize store_purchases table structure
-- 1. Rename tax_amount to commission_fee for better semantics
-- 2. Remove redundant total_amount column (will be calculated)
-- 3. Remove unused handling_fee column  
-- 4. Add price_input_mode for batch/individual pricing functionality

BEGIN;

-- 1. Rename tax_amount to commission_fee if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'store_purchases' AND column_name = 'tax_amount'
  ) THEN
    ALTER TABLE store_purchases RENAME COLUMN tax_amount TO commission_fee;
  END IF;
END $$;

-- 2. Remove redundant total_amount column (calculated field)
ALTER TABLE store_purchases DROP COLUMN IF EXISTS total_amount;

-- 3. Remove unused handling_fee column
ALTER TABLE store_purchases DROP COLUMN IF EXISTS handling_fee;

-- 4. Add price_input_mode for batch/individual pricing
ALTER TABLE store_purchases ADD COLUMN IF NOT EXISTS price_input_mode TEXT DEFAULT 'individual' 
CHECK (price_input_mode IN ('batch', 'individual'));

-- 5. Set default for existing records
UPDATE store_purchases SET price_input_mode = 'individual' WHERE price_input_mode IS NULL;

COMMIT;