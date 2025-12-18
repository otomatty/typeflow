# Tursoクラウドでのプリセット管理セットアップガイド

TypeFlowアプリでプリセットデータをTursoクラウド上で管理するためのセットアップ手順です。

## 概要

このガイドでは、以下の手順を説明します：

1. Tursoクラウドアカウントの作成とデータベースのセットアップ
2. 環境変数の設定
3. マイグレーションの実行
4. プリセットデータの投入

## 前提条件

- Node.js/Bunがインストールされていること
- Turso CLIがインストールされていること（後述）

## セットアップ手順

### 1. Turso CLIのインストール

```bash
# macOS / Linux
curl -sSfL https://get.tur.so/install.sh | bash

# または Homebrew (macOS)
brew install tursodatabase/tap/turso

# Windows
# https://docs.turso.tech/cli/installation を参照
```

### 2. Turso CLIにログイン

```bash
turso auth login
```

ブラウザが開き、GitHubアカウントでログインします。

### 3. データベースの作成

```bash
# データベースを作成
turso db create typeflow-db

# データベース一覧を確認
turso db list
```

### 4. データベースURLとトークンの取得

```bash
# データベースURLを取得
turso db show typeflow-db --url

# 認証トークンを作成（読み書き用）
turso db tokens create typeflow-db

# または、読み取り専用トークンを作成する場合
turso db tokens create typeflow-db --read-only
```

**重要**: トークンは一度しか表示されません。安全な場所に保存してください。

### 5. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成（既に存在する場合は編集）：

```bash
# .env ファイルを作成
touch .env
```

`.env` ファイルを編集：

```env
# TursoデータベースURL（libsql://で始まるURL）
TURSO_DATABASE_URL=libsql://your-database-name-your-org.turso.io

# Turso認証トークン
TURSO_AUTH_TOKEN=your-auth-token-here

# CORS許可オリジン（カンマ区切り）
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# サーバーポート（オプション、デフォルト: 3456）
PORT=3456
```

**セキュリティ注意事項**:

- `.env` ファイルは `.gitignore` に含まれていることを確認してください
- 本番環境では環境変数として設定してください（Render.com、Vercel、Railwayなど）

### 6. マイグレーションの実行

プリセット管理用のテーブルを作成するため、マイグレーションを実行します：

```bash
# リモートTursoデータベースにマイグレーションを適用
bun run db:migrate
```

これにより、以下のテーブルが作成されます：

- `presets`: プリセットのメタデータ
- `preset_words`: プリセットに含まれる単語

### 7. サーバーの起動

```bash
# 開発サーバー（ファイル変更を監視）
bun run server:dev

# または通常起動
bun run server
```

サーバーが起動すると、`http://localhost:3456` でAPIが利用可能になります。

### 8. プリセットデータの投入

既存のプリセットデータをTursoクラウドに一括投入するには、専用のスクリプトを使用します：

```bash
# リモートTursoデータベースにプリセットを投入
bun run db:seed

# ローカルSQLiteファイルにプリセットを投入
bun run db:seed:local

# 既存のプリセットを削除してから投入（クリーンアップ）
bun run db:seed:clear
```

このスクリプトは、`src/lib/presets.ts`で定義されている以下のプリセットを自動的に投入します：

- **寿司打 1万円コース相当** (`sushida-10000`): 555語
- **基本日本語** (`basic-japanese`): 20語
- **プログラミング用語** (`programming`): 25語
- **長文チャレンジ** (`advanced-sentences`): 15語

**合計: 615語**

#### 手動でAPIを使用して投入する場合

```bash
# 例: カスタムプリセットを投入
curl -X POST http://localhost:3456/api/presets \
  -H "Content-Type: application/json" \
  -d '{
    "id": "custom-preset",
    "name": "カスタムプリセット",
    "description": "カスタムプリセットの説明",
    "difficulty": "normal",
    "words": [
      {"text": "テキスト1", "reading": "読み1", "romaji": "romaji1"},
      {"text": "テキスト2", "reading": "読み2", "romaji": "romaji2"}
    ]
  }'
```

## APIエンドポイント

プリセット管理用のAPIエンドポイント：

### プリセット一覧取得

```bash
GET /api/presets
```

### プリセット取得（ID指定）

```bash
GET /api/presets/:id
```

### プリセット作成

```bash
POST /api/presets
Content-Type: application/json

{
  "id": "preset-id",
  "name": "プリセット名",
  "description": "説明",
  "difficulty": "easy" | "normal" | "hard",
  "words": [
    {"text": "テキスト", "reading": "読み", "romaji": "ローマ字"}
  ]
}
```

### プリセット更新

```bash
PUT /api/presets/:id
Content-Type: application/json

{
  "name": "更新された名前",
  "words": [...]
}
```

### プリセット削除

```bash
DELETE /api/presets/:id
```

### 全プリセット削除

```bash
DELETE /api/presets
```

## ローカル開発とクラウドの切り替え

開発環境と本番環境で異なるデータベースを使用する場合：

**開発環境（`.env.local` または `.env`）:**

```env
TURSO_DATABASE_URL=file:./local.db
# TURSO_AUTH_TOKEN は不要（ローカルファイルのため）
```

**本番環境（環境変数）:**

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

同じコードで両方の環境に対応できます。

## 本番環境へのデプロイ

### Render.comでのデプロイ

1. Renderダッシュボードで新しいWebサービスを作成
2. 環境変数を設定：
   - `TURSO_DATABASE_URL`: TursoデータベースURL
   - `TURSO_AUTH_TOKEN`: Turso認証トークン
   - `ALLOWED_ORIGINS`: 許可するオリジン（カンマ区切り）
   - `PORT`: ポート番号（Renderが自動設定する場合は不要）
3. Build Command: `bun install`
4. Start Command: `bun run server`

### その他のプラットフォーム

同様に環境変数を設定すれば、以下のプラットフォームでも動作します：

- **Fly.io**: グローバル分散、無料枠あり
- **Railway**: シンプルなデプロイ、無料枠あり
- **Vercel**: サーバーレス関数として実装が必要
- **Cloudflare Workers**: `wrangler.toml` で環境変数を設定

## トラブルシューティング

### 接続エラー

- `TURSO_DATABASE_URL` と `TURSO_AUTH_TOKEN` が正しく設定されているか確認
- Tursoダッシュボードでデータベースが作成されているか確認
- ネットワーク接続を確認
- トークンが有効期限内か確認（トークンは無期限ですが、再生成が必要な場合があります）

### マイグレーションエラー

- マイグレーションファイルのSQL構文を確認
- 既に適用済みのマイグレーションを再適用しようとしていないか確認
- `migrations` テーブルが正しく作成されているか確認

```bash
# マイグレーション履歴を確認
turso db shell typeflow-db
SELECT * FROM migrations;
```

### プリセットデータが表示されない

- データベースにプリセットが投入されているか確認

```bash
# データベースシェルで確認
turso db shell typeflow-db
SELECT * FROM presets;
SELECT COUNT(*) FROM preset_words;
```

- APIエンドポイントが正しく動作しているか確認

```bash
curl http://localhost:3456/api/presets
```

## 参考リンク

- [Turso公式ドキュメント](https://docs.turso.tech/)
- [Turso CLIリファレンス](https://docs.turso.tech/cli)
- [libSQLクライアントライブラリ](https://github.com/tursodatabase/libsql-client-ts)
- [TypeFlow Tursoセットアップガイド](./TURSO_SETUP.md)
