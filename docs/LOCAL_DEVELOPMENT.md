# ローカル開発ガイド

TypeFlowアプリをローカルで開発する際のデータベース設定ガイドです。

## 概要

TypeFlowは、TursoのlibSQLクライアント（`@libsql/client`）を使用して、以下の2つの方法でデータベースに接続できます：

1. **ローカルSQLiteファイル**: 開発用のローカルデータベース
2. **Tursoクラウド**: 本番環境や複数端末間での同期用

## ローカルSQLiteファイルを使用する

### クイックセットアップ（推奨）

最も簡単な方法は、セットアップスクリプトを使用することです：

```bash
bun run db:setup
```

このコマンドは以下を自動的に実行します：

1. `.env` ファイルを作成（存在しない場合）
2. ローカルデータベースにマイグレーションを適用

### 手動セットアップ

1. **環境変数の設定**

`.env` ファイルを作成または編集：

```env
# ローカル開発用（デフォルト）
TURSO_DATABASE_URL=file:./local.db
# TURSO_AUTH_TOKEN は不要（ローカルファイルのため）
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=3456
```

**注意**: 環境変数が設定されていない場合、サーバーは自動的に `file:./local.db` を使用します。

2. **データベースの初期化**

```bash
# マイグレーションを実行してデータベースを作成
bun run db:migrate:local
```

これで `./local.db` ファイルが作成され、スキーマが適用されます。

3. **サーバーの起動**

```bash
# 開発サーバーを起動
bun run server:dev
```

### データベースファイルの場所

デフォルトでは、プロジェクトルートに `local.db` が作成されます。別の場所に保存したい場合：

```env
TURSO_DATABASE_URL=file:./data/local.db
```

または絶対パス：

```env
TURSO_DATABASE_URL=file:/Users/yourname/databases/typeflow.db
```

### データベースの確認

SQLiteファイルを直接確認するには：

```bash
# SQLite CLIを使用（インストールが必要）
sqlite3 local.db

# テーブル一覧を表示
.tables

# データを確認
SELECT * FROM words LIMIT 10;

# 終了
.quit
```

または、Turso CLIを使用（Turso CLIがインストールされている場合）：

```bash
turso db shell local.db
```

## ローカル開発の利点

- ✅ **オフライン開発**: インターネット接続がなくても開発可能
- ✅ **高速**: ローカルファイルへのアクセスは非常に高速
- ✅ **無料**: クラウドサービスの無料枠を消費しない
- ✅ **データの独立性**: 本番データに影響を与えない
- ✅ **簡単なリセット**: データベースファイルを削除するだけでリセット可能

## データベースのリセット

開発中にデータベースをリセットしたい場合：

```bash
# データベースファイルを削除
rm local.db

# マイグレーションを再実行
bun run db:migrate:local
```

## ローカルとクラウドの切り替え

同じコードでローカルとクラウドの両方に対応できます。環境変数を変更するだけです：

### ローカル開発

```env
TURSO_DATABASE_URL=file:./local.db
```

### クラウド（本番環境）

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

## トラブルシューティング

### データベースファイルが見つからない

マイグレーションを実行していない可能性があります：

```bash
bun run db:migrate:local
```

### 権限エラー

データベースファイルの書き込み権限を確認：

```bash
ls -la local.db
chmod 644 local.db  # 必要に応じて
```

### データベースがロックされている

別のプロセスがデータベースを使用している可能性があります。サーバーを停止してから再試行してください。

## 次のステップ

- [Tursoセットアップガイド](./TURSO_SETUP.md) - クラウドデータベースのセットアップ
- [マイグレーションガイド](./TURSO_SETUP.md#マイグレーション) - スキーマ変更の方法
