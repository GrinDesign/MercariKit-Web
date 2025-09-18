# Google認証とマルチテナント対応の実装計画

## 実装の流れ

### フェーズ1: 認証基盤の構築
1. Supabase AuthでGoogle認証を有効化
2. ログイン/ログアウトコンポーネントの作成
3. 認証状態の管理（Context API）

### フェーズ2: データベースのマルチテナント化
1. 各テーブルにuser_id列を追加
2. 既存データの移行（必要に応じて）
3. Row Level Security (RLS) ポリシーの設定

### フェーズ3: アプリケーションの修正
1. 全てのクエリにユーザーフィルタを追加
2. データ作成時にuser_idを自動設定
3. 権限チェックの実装

## データベース変更内容

### 影響を受けるテーブル
- `purchase_sessions` → user_id列を追加
- `stores` → user_id列を追加
- `store_purchases` → session経由でuser_idを参照
- `products` → store_purchase経由でuser_idを参照

### RLSポリシー
各テーブルに以下のポリシーを設定：
- SELECT: user_id = auth.uid()
- INSERT: user_id = auth.uid()
- UPDATE: user_id = auth.uid()
- DELETE: user_id = auth.uid()

## 実装手順

### ステップ1: Supabaseの設定
```sql
-- 1. テーブルにuser_id列を追加
ALTER TABLE purchase_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE stores ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- 2. RLSを有効化
ALTER TABLE purchase_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 3. RLSポリシーを作成
CREATE POLICY "Users can only see their own sessions"
ON purchase_sessions FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own stores"
ON stores FOR ALL
USING (auth.uid() = user_id);
```

### ステップ2: 認証コンポーネント
- `/src/components/Auth.tsx` - ログインページ
- `/src/contexts/AuthContext.tsx` - 認証状態管理
- `/src/components/PrivateRoute.tsx` - 認証が必要なルート

### ステップ3: 既存コードの修正
- 全てのSupabaseクエリにuser_idフィルタを追加
- データ作成時にuser_idを設定

## 注意事項
- 既存データのバックアップを取る
- 段階的にテストしながら進める
- 本番環境への適用は慎重に行う

## メリット
- ユーザーごとにデータを完全分離
- セキュリティの向上
- マルチユーザー対応

## 推定作業時間
- フェーズ1: 1-2時間
- フェーズ2: 2-3時間
- フェーズ3: 3-4時間

合計: 約6-9時間