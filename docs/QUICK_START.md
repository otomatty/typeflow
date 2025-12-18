# クイックスタートガイド

TypeFlowアプリをローカルで素早く起動するためのガイドです。

## 前提条件

- Bun がインストールされていること
- Node.js 18+ がインストールされていること（Bunがない場合）

## セットアップ手順

### 1. リポジトリのクローンと依存関係のインストール

```bash
git clone https://github.com/otomatty/typeflow.git
cd typeflow
bun install
```

### 2. ローカルデータベースのセットアップ

```bash
bun run db:setup
```

このコマンドは以下を実行します：

- `.env` ファイルを作成（ローカルDB設定）
- データベースマイグレーションを実行

### 3. 開発サーバーの起動

**フロントエンド（別ターミナル）:**

```bash
bun run dev
```

**バックエンドAPI（別ターミナル）:**

```bash
bun run server:dev
```

### 4. アプリケーションにアクセス

- フロントエンド: http://localhost:5173
- API: http://localhost:3456

## トラブルシューティング

### データベースエラー

データベースが正しく初期化されていない場合：

```bash
# マイグレーションを再実行
bun run db:migrate:local
```

### ポートが使用中

ポート3456が既に使用されている場合、`.env`ファイルで変更：

```env
PORT=3457
```

### 環境変数の確認

`.env`ファイルが正しく作成されているか確認：

```bash
cat .env
```

期待される内容：

```
TURSO_DATABASE_URL=file:./local.db
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=3456
```

## 次のステップ

- [ローカル開発ガイド](./LOCAL_DEVELOPMENT.md) - ローカルDBの詳細
- [Tursoセットアップガイド](./TURSO_SETUP.md) - クラウドDBのセットアップ
- [README](../README.md) - プロジェクトの概要
