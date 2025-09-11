-- 商品テーブルに生産国と年代のカラムを追加
ALTER TABLE products 
ADD COLUMN production_country VARCHAR(100),
ADD COLUMN decade VARCHAR(20) DEFAULT '90s';

-- インデックス追加（パフォーマンス向上）
CREATE INDEX idx_products_production_country ON products(production_country);
CREATE INDEX idx_products_decade ON products(decade);

-- コメント追加
COMMENT ON COLUMN products.production_country IS '生産国';
COMMENT ON COLUMN products.decade IS '年代（50s, 60s, 70s, 80s, 90s, 00s, 10s, 20s, 50s〜60s, 60s〜70s, 70s〜80s, 80s〜90s, 90s〜00s, 不明）';