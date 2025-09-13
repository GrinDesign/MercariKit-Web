-- セッション作成の課題を修正するマイグレーション
-- purchase_sessions テーブルの必要なカラムを追加・修正

-- まず、カラムが存在するかチェックして、存在しない場合は追加
DO $$
BEGIN
    -- session_date カラムが存在しない場合は追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='purchase_sessions' AND column_name='session_date') THEN
        ALTER TABLE purchase_sessions 
        ADD COLUMN session_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    -- created_at カラムが存在しない場合は追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='purchase_sessions' AND column_name='created_at') THEN
        ALTER TABLE purchase_sessions 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- updated_at カラムが存在しない場合は追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='purchase_sessions' AND column_name='updated_at') THEN
        ALTER TABLE purchase_sessions 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- session_date カラムにデフォルト値を設定（既に存在する場合）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name='purchase_sessions' AND column_name='session_date') THEN
        ALTER TABLE purchase_sessions 
        ALTER COLUMN session_date SET DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- 既存のレコードでsession_dateがNULLの場合、created_atまたは現在日付を設定
UPDATE purchase_sessions 
SET session_date = COALESCE(DATE(created_at), CURRENT_DATE)
WHERE session_date IS NULL;

-- session_date を NOT NULL に設定
ALTER TABLE purchase_sessions 
ALTER COLUMN session_date SET NOT NULL;

-- トリガーが存在しない場合は作成
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchase_sessions_updated_at') THEN
        CREATE TRIGGER update_purchase_sessions_updated_at 
        BEFORE UPDATE ON purchase_sessions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_session_date ON purchase_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_status ON purchase_sessions(status);