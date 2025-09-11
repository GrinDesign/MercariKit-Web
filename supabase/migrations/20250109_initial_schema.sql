-- Create tables if not exists
CREATE TABLE IF NOT EXISTS purchase_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  transportation_cost DECIMAL(10,2) DEFAULT 0,
  transfer_fee DECIMAL(10,2) DEFAULT 0,
  agency_fee DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('online', 'recycle', 'wholesale', 'other')),
  prefecture TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES purchase_sessions(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  purchase_date DATE NOT NULL,
  total_amount DECIMAL(10,2) DEFAULT 0,
  product_cost DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  commission_fee DECIMAL(10,2) DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  payment_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_purchase_id UUID REFERENCES store_purchases(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  mercari_title TEXT,
  brand TEXT,
  category TEXT NOT NULL,
  size TEXT,
  color TEXT,
  condition TEXT NOT NULL,
  gender TEXT,
  purchase_cost DECIMAL(10,2) DEFAULT 0,
  allocated_cost DECIMAL(10,2),
  initial_price DECIMAL(10,2) DEFAULT 0,
  current_price DECIMAL(10,2) DEFAULT 0,
  sold_price DECIMAL(10,2),
  reference_price DECIMAL(10,2),
  photos TEXT[],
  measurements JSONB,
  description TEXT,
  template_description TEXT,
  notes TEXT,
  status TEXT DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'ready_to_list', 'listed', 'sold', 'on_hold', 'discarded')),
  shipping_method TEXT,
  shipping_cost DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  net_profit DECIMAL(10,2),
  listed_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  discarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_store_purchase_id ON products(store_purchase_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_store_purchases_session_id ON store_purchases(session_id);
CREATE INDEX IF NOT EXISTS idx_store_purchases_store_id ON store_purchases(store_id);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_purchase_sessions_updated_at ON purchase_sessions;
CREATE TRIGGER update_purchase_sessions_updated_at BEFORE UPDATE ON purchase_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_store_purchases_updated_at ON store_purchases;
CREATE TRIGGER update_store_purchases_updated_at BEFORE UPDATE ON store_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();