-- 出品管理機能用の追加カラム

-- ENUM型にon_holdとdiscardedを追加
ALTER TYPE product_status ADD VALUE 'on_hold';
ALTER TYPE product_status ADD VALUE 'discarded';

-- 保留機能用カラム
ALTER TABLE products 
ADD COLUMN hold_reason TEXT,
ADD COLUMN held_at TIMESTAMPTZ;

-- 破棄機能用カラム
ALTER TABLE products 
ADD COLUMN discard_reason TEXT;

-- インデックス追加（パフォーマンス向上）
-- 注意: ENUMの新しい値を同じトランザクション内で使用するとエラーになるため
-- 下記のインデックスは別途実行してください
-- CREATE INDEX idx_products_held_at ON products(held_at) WHERE held_at IS NOT NULL;
-- CREATE INDEX idx_products_status_held_at ON products(status, held_at) WHERE status = 'on_hold';