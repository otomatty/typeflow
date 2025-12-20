# Clerk + Turso 認証セットアップガイド

このドキュメントでは、ClerkとTursoの連携を設定する手順を説明します。

参考: [Turso Authorization Quickstart](https://docs.turso.tech/connect/authorization)

## 概要

TypeFlowは、Clerkを認証プロバイダーとして使用し、Tursoデータベースへのアクセスを制御します。Clerkが発行するJWTトークンは、Tursoの認証システムと統合され、データベースレベルの権限管理を実現します。

## セットアップ手順

### 1. Clerkアカウントの作成と設定

1. [Clerk](https://clerk.com/)にアクセスしてアカウントを作成
2. 新しいアプリケーションを作成
3. [API keys page](https://dashboard.clerk.com/last-active?path=api-keys)から環境変数を取得:
   - `VITE_CLERK_PUBLISHABLE_KEY` (フロントエンド用、Reactを選択)
   - `CLERK_SECRET_KEY` (バックエンド用)

**重要**: Viteプロジェクトでは、環境変数名に`VITE_`プレフィックスが必要です。

### 2. TursoでのJWTテンプレート生成

Turso CLIを使用して、データベースへのアクセス権限を定義するJWTテンプレートを生成します。

```bash
# データベースへのフルアクセス権限を設定
turso org jwks template --database <database-name> --scope full-access

# または、テーブルレベルの細かい権限を設定
turso org jwks template \
  --database <database-name> \
  --permissions all:data_read,data_add,data_update \
  --permissions words:data_read,data_add,data_update,data_delete \
  --permissions aggregated_stats:data_read,data_update \
  --permissions settings:data_read,data_update \
  --permissions game_scores:data_read,data_add \
  --permissions user_presets:data_read,data_add,data_update,data_delete
```

利用可能なアクション:

- `data_read` - テーブルからのデータ読み取り
- `data_update` - 既存データの更新
- `data_add` - 新しいデータの挿入
- `data_delete` - データの削除
- `schema_update` - テーブルスキーマの変更
- `schema_add` - 新しいテーブルの作成
- `schema_delete` - テーブルの削除

### 3. ClerkでのJWTテンプレート設定

1. Clerkダッシュボードにログイン
2. **JWT Templates**セクションに移動
3. 新しいテンプレートを作成
4. 以下のJSONテンプレートをコピーして使用:

```json
{
  "a": "rw",
  "id": "1d998095-2388-4f69-be00-16fc0614e313",
  "perm": [
    {
      "t": ["words"],
      "a": ["data_read", "data_add", "data_update", "data_delete"]
    },
    {
      "t": ["aggregated_stats"],
      "a": ["data_read", "data_update"]
    },
    {
      "t": ["settings"],
      "a": ["data_read", "data_update"]
    },
    {
      "t": ["game_scores"],
      "a": ["data_read", "data_add"]
    },
    {
      "t": ["user_presets"],
      "a": ["data_read", "data_add", "data_update", "data_delete"]
    },
    {
      "t": ["user_preset_words"],
      "a": ["data_read", "data_add", "data_update", "data_delete"]
    },
    {
      "t": ["presets"],
      "a": ["data_read"]
    },
    {
      "t": ["preset_words"],
      "a": ["data_read"]
    }
  ],
  "rid": "d54214ca-4d03-4aea-a505-f20eec1ddad5"
}
```

**注意**: このテンプレートはすべてのユーザーに同じ権限を付与します。将来的にロールベースの権限管理が必要な場合は、ユーザーメタデータ（例: ロール、グループ）に応じて権限を動的に設定できます。

テンプレートファイル: `docs/turso-jwt-template.json`

### 4. JWKSエンドポイントをTursoに追加 ✅ 完了

ClerkのJWKSエンドポイントをTurso組織に追加しました。

```bash
# JWKSエンドポイントを追加（完了）
turso org jwks save clerk https://vast-whale-1.clerk.accounts.dev/.well-known/jwks.json
```

**設定済み**:

- 名前: `clerk`
- URL: `https://vast-whale-1.clerk.accounts.dev/.well-known/jwks.json`

### 5. 環境変数の設定

プロジェクトルートに`.env.local`ファイルを作成（`.env.local`は`.gitignore`に含まれていることを確認）:

```env
# Clerk設定
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Turso設定
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-fallback-token  # 認証されていないリクエスト用（オプション）

# API設定
VITE_API_BASE_URL=http://localhost:3456/api
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3456
PORT=3456
```

### 6. 依存関係のインストール

```bash
npm install
```

### 7. データベースマイグレーションの実行

```bash
# リモートTursoデータベース
npm run db:migrate

# ローカルSQLiteファイル
npm run db:migrate:local
```

### 8. サーバーの起動

```bash
# 開発モード
npm run server:dev

# 通常起動
npm run server
```

## 動作確認

1. フロントエンドを起動: `npm run dev`
2. ブラウザでアプリケーションにアクセス
3. Clerkのサインアップ/ログイン画面が表示されることを確認
4. ログイン後、アプリケーションが正常に動作することを確認

## トラブルシューティング

### 認証エラーが発生する場合

1. Clerkの環境変数が正しく設定されているか確認
2. JWKSエンドポイントがTursoに正しく追加されているか確認
3. JWTテンプレートが正しく設定されているか確認

### データベースアクセスエラーが発生する場合

1. TursoのJWTテンプレートで必要な権限が設定されているか確認
2. ClerkのJWTテンプレートでTursoの権限が正しく設定されているか確認
3. データベースURLとトークンが正しいか確認

## セキュリティ注意事項

- **本番環境では必ず強力なシークレットキーを使用**
- **HTTPSを有効化**（本番環境）
- **CORS設定を適切に制限**（本番環境）
- **環境変数を安全に管理**（.envファイルをGitにコミットしない）

## 参考資料

- [Clerk React Quickstart](https://clerk.com/docs/react/getting-started/quickstart)
- [Turso Authorization Documentation](https://docs.turso.tech/connect/authorization)
- [Clerk Documentation](https://clerk.com/docs)
- [Turso CLI Documentation](https://docs.turso.tech/cli)

## 実装の確認ポイント

✅ `main.tsx`で`<ClerkProvider publishableKey={...}>`を使用  
✅ 環境変数名は`VITE_CLERK_PUBLISHABLE_KEY`（`VITE_`プレフィックス必須）  
✅ `afterSignOutUrl`プロパティを設定  
✅ `SignedIn`/`SignedOut`コンポーネントを使用して認証状態を管理  
✅ `.env.local`ファイルを使用（`.gitignore`に含まれていることを確認）
