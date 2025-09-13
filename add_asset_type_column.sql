-- 商品テーブルにasset_typeカラムを追加
-- 資産型商品（asset）と回転型商品（quick_turn）を区別

ALTER TABLE products 
ADD COLUMN asset_type VARCHAR(20) DEFAULT 'quick_turn';

-- asset_typeの値制約を追加（オプション）
ALTER TABLE products 
ADD CONSTRAINT check_asset_type 
CHECK (asset_type IN ('asset', 'quick_turn'));

-- 既存データのasset_typeを確認（実行後の確認用）
-- SELECT asset_type, COUNT(*) FROM products GROUP BY asset_type;

-- カラム追加の確認
-- \d products;