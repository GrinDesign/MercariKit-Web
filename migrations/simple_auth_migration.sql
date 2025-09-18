-- ===============================================
-- 簡易版：認証対応マイグレーション（段階的実装）
-- ===============================================

-- ステップ1: user_id列を追加（既存データを保持）
-- ===============================================

-- purchase_sessionsテーブルにuser_id列を追加
ALTER TABLE purchase_sessions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- storesテーブルにuser_id列を追加
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- インデックスを追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_user_id ON purchase_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);

-- ===============================================
-- 注意：この段階ではRLSは有効化しません
-- 既存データが見えなくなることを防ぐため
-- ===============================================

-- 確認用クエリ（実行後、既存データを確認）
-- SELECT COUNT(*) as total_sessions FROM purchase_sessions;
-- SELECT COUNT(*) as sessions_with_user FROM purchase_sessions WHERE user_id IS NOT NULL;
-- SELECT COUNT(*) as total_stores FROM stores;
-- SELECT COUNT(*) as stores_with_user FROM stores WHERE user_id IS NOT NULL;