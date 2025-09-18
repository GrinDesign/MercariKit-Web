# Google認証の設定手順

## 1. Google Cloud Consoleでの設定

### ステップ1: Google Cloud Consoleにアクセス
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. Googleアカウントでログイン

### ステップ2: プロジェクトの作成（既存のプロジェクトがない場合）
1. 画面上部のプロジェクトセレクターをクリック
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を入力（例：「MercariKit」）
4. 「作成」をクリック

### ステップ3: OAuth同意画面の設定
1. 左側メニューから「APIとサービス」→「OAuth同意画面」を選択
2. ユーザータイプを選択：
   - **外部**: 任意のGoogleアカウントでログイン可能（推奨）
   - **内部**: 組織内のアカウントのみ（G Suite必要）
3. 「作成」をクリック
4. 必要情報を入力：
   - **アプリ名**: MercariKit（または任意の名前）
   - **ユーザーサポートメール**: あなたのメールアドレス
   - **デベロッパー連絡先情報**: あなたのメールアドレス
5. 「保存して次へ」をクリック
6. スコープは追加不要なので「保存して次へ」
7. テストユーザーも必要に応じて追加（後でも可能）
8. 「保存して次へ」

### ステップ4: OAuth 2.0クライアントIDの作成
1. 左側メニューから「APIとサービス」→「認証情報」を選択
2. 上部の「＋認証情報を作成」→「OAuthクライアントID」をクリック
3. アプリケーションの種類：「ウェブアプリケーション」を選択
4. 名前を入力（例：「MercariKit Web Client」）
5. **承認済みのJavaScriptオリジン**に追加：
   ```
   http://localhost:5173
   http://localhost:3000
   ```
   （本番環境の場合は本番URLも追加）

6. **承認済みのリダイレクトURI**に追加：
   ```
   https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/auth/v1/callback
   ```
   ※ YOUR-SUPABASE-PROJECT-IDは実際のSupabaseプロジェクトIDに置き換え

7. 「作成」をクリック

### ステップ5: クライアントIDとシークレットの取得
1. 作成後、モーダルにクライアントIDとクライアントシークレットが表示される
2. これらをコピーして保存（後でSupabaseに設定）

## 2. Supabaseでの設定

### ステップ1: Supabaseダッシュボードにログイン
1. [Supabase](https://app.supabase.com/)にアクセス
2. 該当プロジェクトを選択

### ステップ2: Google認証プロバイダーの有効化
1. 左側メニューから「Authentication」→「Providers」を選択
2. 「Google」を見つけて「Enable」をONにする
3. 以下を入力：
   - **Client ID**: Google Cloud Consoleで取得したクライアントID
   - **Client Secret**: Google Cloud Consoleで取得したクライアントシークレット
4. 「Save」をクリック

### ステップ3: リダイレクトURLの確認
1. Supabaseの「Authentication」→「URL Configuration」を確認
2. 「Site URL」を設定：
   ```
   http://localhost:5173
   ```
   （本番環境の場合は本番URLに変更）

## 3. 動作確認

### ローカル環境でのテスト
1. アプリケーションを起動
   ```bash
   npm run dev
   ```
2. ブラウザで http://localhost:5173 にアクセス
3. 自動的にログイン画面が表示される
4. 「Googleでログイン」をクリック
5. Googleアカウントを選択してログイン
6. 正常にアプリケーションにリダイレクトされれば成功！

## トラブルシューティング

### エラー: redirect_uri_mismatch
**原因**: リダイレクトURIが一致しない
**解決方法**:
- Google Cloud ConsoleのリダイレクトURIを確認
- SupabaseプロジェクトのURLが正しいか確認

### エラー: 認証後、ログイン画面に戻る
**原因**: Site URLの設定ミス
**解決方法**:
- SupabaseのURL Configurationを確認
- Site URLがアプリケーションのURLと一致しているか確認

### エラー: Google認証ボタンが動作しない
**原因**: SupabaseのGoogle Provider設定が不完全
**解決方法**:
- Client IDとClient Secretが正しく設定されているか確認
- Providerが有効化されているか確認

## セキュリティの注意事項
- クライアントシークレットは絶対に公開しない
- 本番環境では必ずHTTPSを使用する
- 承認済みオリジンとリダイレクトURIは必要最小限に設定する