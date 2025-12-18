# Tursoデータベースセットアップガイド

TypeFlowアプリでTursoデータベースを使用するためのセットアップ手順です。

## 概要

Tursoは、libSQLベースの分散型SQLiteデータベースです。以下の特徴があります：

- **SQLite互換**: 既存のSQLiteクエリがそのまま動作
- **グローバル分散**: 低レイテンシーで世界中からアクセス可能（クラウド使用時）
- **スケーラブル**: 自動スケーリング対応（クラウド使用時）
- **無料枠**: 寛大な無料プラン（500MB、1億行/月）
- **ローカル対応**: `@libsql/client`を使用してローカルのSQLiteファイルにも接続可能

### ローカル開発とクラウドの選択

- **ローカル開発**: `file:./local.db` を使用してローカルのSQLiteファイルに接続
- **クラウド**: `libsql://` URLを使用してTursoのクラウドサービスに接続

どちらも同じ `@libsql/client` を使用するため、コードの変更は不要です。

## セットアップ手順

### 1. Tursoアカウントの作成

1. [Turso公式サイト](https://turso.tech/)にアクセス
2. アカウントを作成（GitHubアカウントでログイン可能）
3. ダッシュボードにログイン

### 2. Turso CLIのインストール

```bash
# macOS / Linux
curl -sSfL https://get.tur.so/install.sh | bash

# または Homebrew (macOS)
brew install tursodatabase/tap/turso

# Windows
# https://docs.turso.tech/cli/installation を参照
```

### 3. Turso CLIにログイン

```bash
turso auth login
```

### 4. データベースの作成

```bash
# データベースを作成
turso db create typeflow-db

# データベース一覧を確認
turso db list
```

### 5. データベースURLとトークンの取得

```bash
# データベースURLを取得
turso db show typeflow-db --url

# 認証トークンを作成
turso db tokens create typeflow-db
```

### 6. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成：

```bash
cp .env.example .env
```

`.env` ファイルを編集：

```env
TURSO_DATABASE_URL=libsql://your-database-name-your-org.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=3456
```

### 7. マイグレーションの実行

```bash
# リモートTursoデータベースにマイグレーションを適用
bun run db:migrate

# ローカルSQLiteファイルにマイグレーションを適用（開発用）
bun run db:migrate:local
```

### 8. サーバーの起動

```bash
# 開発サーバー（ファイル変更を監視）
bun run server:dev

# または通常起動
bun run server
```

サーバーが起動すると、`http://localhost:3456` でAPIが利用可能になります。

## ローカル開発

ローカル開発時は、**TursoのlibSQLクライアントを使用してローカルのSQLiteファイルに接続**できます。これにより、クラウドサービスを使わずに開発できます。

### ローカルSQLiteファイルを使用する方法

`.env` ファイルで `file:` URLスキームを使用します：

```env
# .env
TURSO_DATABASE_URL=file:./local.db
# TURSO_AUTH_TOKEN は不要（ローカルファイルのため）
```

### ローカル開発の利点

- **オフライン開発**: インターネット接続がなくても開発可能
- **高速**: ローカルファイルへのアクセスは非常に高速
- **無料**: クラウドサービスの無料枠を消費しない
- **データの独立性**: 本番データに影響を与えない

### ローカルデータベースの初期化

```bash
# ローカルデータベースにマイグレーションを適用
bun run db:migrate:local
```

これで `./local.db` ファイルが作成され、スキーマが適用されます。

### ローカルとリモートの切り替え

開発環境と本番環境で異なるデータベースを使用する場合：

**開発環境（`.env.local` または `.env`）:**

```env
TURSO_DATABASE_URL=file:./local.db
```

**本番環境（環境変数）:**

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

同じコードで両方の環境に対応できます。

## マイグレーション

### 新しいマイグレーションの作成

1. `migrations/` ディレクトリに新しいSQLファイルを作成
2. ファイル名は `0003_description.sql` のような形式（連番で管理）
3. SQLを記述

例: `migrations/0003_add_user_table.sql`

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);
```

### マイグレーションの適用

```bash
# リモートデータベース
bun run db:migrate

# ローカルデータベース
bun run db:migrate:local
```

## Turso CLIコマンド

### データベース管理

```bash
# データベース一覧
turso db list

# データベース情報を表示
turso db show typeflow-db

# データベースを削除
turso db destroy typeflow-db
```

### データベースシェル

```bash
# インタラクティブなSQLシェル
turso db shell typeflow-db

# または
bun run turso:shell
```

### レプリカの管理

```bash
# レプリカを作成（特定のリージョンに）
turso db replicate typeflow-db --location iad

# レプリカ一覧
turso db locations typeflow-db
```

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
- **Heroku**: 有料プランのみ
- **Vercel**: サーバーレス関数として実装が必要

## トラブルシューティング

### 接続エラー

- `TURSO_DATABASE_URL` と `TURSO_AUTH_TOKEN` が正しく設定されているか確認
- Tursoダッシュボードでデータベースが作成されているか確認
- ネットワーク接続を確認

### マイグレーションエラー

- マイグレーションファイルのSQL構文を確認
- 既に適用済みのマイグレーションを再適用しようとしていないか確認
- `migrations` テーブルが正しく作成されているか確認

### パフォーマンス

- Tursoは自動的にレプリカを作成して低レイテンシーを実現
- 必要に応じて手動でレプリカを作成（`turso db replicate`）

## 参考リンク

- [Turso公式ドキュメント](https://docs.turso.tech/)
- [Turso CLIリファレンス](https://docs.turso.tech/cli)
- [libSQLクライアントライブラリ](https://github.com/tursodatabase/libsql-client-ts)
