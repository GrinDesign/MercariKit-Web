-- ===============================================
-- Google認証とマルチテナント対応のマイグレーション
-- ===============================================

-- ステップ1: user_id列をテーブルに追加
-- ===============================================

-- purchase_sessionsテーブルにuser_id列を追加
ALTER TABLE purchase_sessions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- storesテーブルにuser_id列を追加
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- ステップ2: 既存データの移行（オプション）
-- ===============================================
-- 既存データがある場合、特定のユーザーIDに紐付ける必要があります
-- 例: UPDATE purchase_sessions SET user_id = 'your-user-id' WHERE user_id IS NULL;
-- 例: UPDATE stores SET user_id = 'your-user-id' WHERE user_id IS NULL;

-- ステップ3: Row Level Security (RLS) を有効化
-- ===============================================

ALTER TABLE purchase_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ステップ4: RLSポリシーを作成
-- ===============================================

-- purchase_sessions のポリシー
DROP POLICY IF EXISTS "Users can view own purchase_sessions" ON purchase_sessions;
CREATE POLICY "Users can view own purchase_sessions" ON purchase_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own purchase_sessions" ON purchase_sessions;
CREATE POLICY "Users can insert own purchase_sessions" ON purchase_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own purchase_sessions" ON purchase_sessions;
CREATE POLICY "Users can update own purchase_sessions" ON purchase_sessions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own purchase_sessions" ON purchase_sessions;
CREATE POLICY "Users can delete own purchase_sessions" ON purchase_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- stores のポリシー
DROP POLICY IF EXISTS "Users can view own stores" ON stores;
CREATE POLICY "Users can view own stores" ON stores
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own stores" ON stores;
CREATE POLICY "Users can insert own stores" ON stores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own stores" ON stores;
CREATE POLICY "Users can update own stores" ON stores
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own stores" ON stores;
CREATE POLICY "Users can delete own stores" ON stores
    FOR DELETE USING (auth.uid() = user_id);

-- store_purchases のポリシー（session経由でアクセス制御）
DROP POLICY IF EXISTS "Users can view own store_purchases" ON store_purchases;
CREATE POLICY "Users can view own store_purchases" ON store_purchases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM purchase_sessions
            WHERE purchase_sessions.id = store_purchases.session_id
            AND purchase_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own store_purchases" ON store_purchases;
CREATE POLICY "Users can insert own store_purchases" ON store_purchases
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM purchase_sessions
            WHERE purchase_sessions.id = store_purchases.session_id
            AND purchase_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own store_purchases" ON store_purchases;
CREATE POLICY "Users can update own store_purchases" ON store_purchases
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM purchase_sessions
            WHERE purchase_sessions.id = store_purchases.session_id
            AND purchase_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own store_purchases" ON store_purchases;
CREATE POLICY "Users can delete own store_purchases" ON store_purchases
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM purchase_sessions
            WHERE purchase_sessions.id = store_purchases.session_id
            AND purchase_sessions.user_id = auth.uid()
        )
    );

-- products のポリシー（store_purchase経由でアクセス制御）
DROP POLICY IF EXISTS "Users can view own products" ON products;
CREATE POLICY "Users can view own products" ON products
    FOR SELECT USING (
        store_purchase_id IS NULL OR
        EXISTS (
            SELECT 1 FROM store_purchases
            JOIN purchase_sessions ON purchase_sessions.id = store_purchases.session_id
            WHERE store_purchases.id = products.store_purchase_id
            AND purchase_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own products" ON products;
CREATE POLICY "Users can insert own products" ON products
    FOR INSERT WITH CHECK (
        store_purchase_id IS NULL OR
        EXISTS (
            SELECT 1 FROM store_purchases
            JOIN purchase_sessions ON purchase_sessions.id = store_purchases.session_id
            WHERE store_purchases.id = products.store_purchase_id
            AND purchase_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own products" ON products;
CREATE POLICY "Users can update own products" ON products
    FOR UPDATE USING (
        store_purchase_id IS NULL OR
        EXISTS (
            SELECT 1 FROM store_purchases
            JOIN purchase_sessions ON purchase_sessions.id = store_purchases.session_id
            WHERE store_purchases.id = products.store_purchase_id
            AND purchase_sessions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own products" ON products;
CREATE POLICY "Users can delete own products" ON products
    FOR DELETE USING (
        store_purchase_id IS NULL OR
        EXISTS (
            SELECT 1 FROM store_purchases
            JOIN purchase_sessions ON purchase_sessions.id = store_purchases.session_id
            WHERE store_purchases.id = products.store_purchase_id
            AND purchase_sessions.user_id = auth.uid()
        )
    );

-- ステップ5: インデックスを追加（パフォーマンス向上）
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_purchase_sessions_user_id ON purchase_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);

-- ===============================================
-- 注意事項
-- ===============================================
-- 1. このSQLを実行する前に、必ずバックアップを取ってください
-- 2. Supabaseダッシュボードで Authentication > Providers からGoogleプロバイダーを有効化してください
-- 3. 既存データがある場合は、user_idを設定する必要があります
-- 4. 本番環境への適用は慎重に行ってください