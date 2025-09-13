-- Add shipping type fields for planned and actual shipping management
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS planned_shipping_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS planned_shipping_cost INTEGER,
ADD COLUMN IF NOT EXISTS actual_shipping_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS actual_shipping_cost INTEGER;

-- Add check constraints for shipping types
ALTER TABLE products 
ADD CONSTRAINT planned_shipping_type_check 
CHECK (planned_shipping_type IN ('YUYU_215', 'RAKURAKU_750', 'RAKURAKU_850') OR planned_shipping_type IS NULL);

ALTER TABLE products 
ADD CONSTRAINT actual_shipping_type_check 
CHECK (actual_shipping_type IN ('YUYU_215', 'RAKURAKU_750', 'RAKURAKU_850') OR actual_shipping_type IS NULL);

-- Add check constraints for shipping costs
ALTER TABLE products 
ADD CONSTRAINT planned_shipping_cost_check 
CHECK (planned_shipping_cost IN (215, 750, 850) OR planned_shipping_cost IS NULL);

ALTER TABLE products 
ADD CONSTRAINT actual_shipping_cost_check 
CHECK (actual_shipping_cost IN (215, 750, 850) OR actual_shipping_cost IS NULL);

-- Update existing shipping_cost to planned_shipping_cost where applicable
UPDATE products 
SET planned_shipping_cost = shipping_cost,
    planned_shipping_type = CASE 
        WHEN shipping_cost = 215 THEN 'YUYU_215'
        WHEN shipping_cost = 750 THEN 'RAKURAKU_750'
        WHEN shipping_cost = 850 THEN 'RAKURAKU_850'
        ELSE NULL
    END
WHERE shipping_cost IS NOT NULL;