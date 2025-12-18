# Turso移行完了ガイド

このドキュメントは、Cloudflare D1からTursoへの移行が完了したことを説明します。

## 変更概要

### データベース層の変更

- **旧**: Cloudflare D1 (`@cloudflare/workers-types`)
- **新**: Turso (`@libsql/client`)

### サーバー実装の変更

- **旧**: Cloudflare Workers専用（`wrangler.toml`で設定）
- **新**: Bunサーバー（`src/server/server.ts`）+ Turso

### 主な変更ファイル

1. **`src/server/db.ts`**
   - `D1Database` → `Client` (libSQL)
   - すべてのデータベース操作をTursoクライアントAPIに移行

2. **`src/server/types.ts`**
   - `Env`インターフェースを更新（`D1Database` → `Client`）

3. **`src/server/server.ts`** (新規)
   - Bunサーバーエントリーポイント
   - Tursoクライアントの初期化
   - 環境変数からの設定読み込み

4. **`scripts/migrate.ts`** (新規)
   - Turso用マイグレーションスクリプト
   - ローカル/リモート両対応

5. **`package.json`**
   - Cloudflare Workers関連スクリプトを削除
   - Turso関連スクリプトを追加

6. **`wrangler.toml`**
   - コメントでTurso移行を説明
   - 旧D1設定はコメントアウト

## 使用方法

### 1. 環境変数の設定

`.env`ファイルを作成：

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
ALLOWED_ORIGINS=http://localhost:5173
PORT=3456
```

### 2. マイグレーションの実行

```bash
# リモートTursoデータベース
bun run db:migrate

# ローカルSQLiteファイル
bun run db:migrate:local
```

### 3. サーバーの起動

```bash
# 開発モード（ファイル変更を監視）
bun run server:dev

# 通常起動
bun run server
```

## API互換性

既存のAPIエンドポイントは変更ありません：

- `GET /api/words` - 単語一覧取得
- `POST /api/words` - 単語作成
- `PUT /api/words/:id` - 単語更新
- `DELETE /api/words/:id` - 単語削除
- `POST /api/words/bulk` - 一括挿入
- `GET /api/stats` - 統計取得
- `PUT /api/stats` - 統計更新
- `GET /api/settings` - 設定取得
- `PUT /api/settings` - 設定更新
- `GET /api/scores` - スコア一覧取得
- `POST /api/scores` - スコア作成

## デプロイ

### Render.com

1. 新しいWebサービスを作成
2. 環境変数を設定：
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `ALLOWED_ORIGINS`
3. Build Command: `bun install`
4. Start Command: `bun run server`

### その他のプラットフォーム

同様に環境変数を設定すれば、以下のプラットフォームでも動作します：

- Fly.io
- Railway
- Heroku
- Vercel (サーバーレス関数として実装が必要)

## ローカル開発

ローカル開発時は、SQLiteファイルを使用できます：

```env
TURSO_DATABASE_URL=file:./local.db
```

この場合、認証トークンは不要です。

## トラブルシューティング

### データベース接続エラー

- 環境変数が正しく設定されているか確認
- Tursoダッシュボードでデータベースが作成されているか確認
- ネットワーク接続を確認

### マイグレーションエラー

- マイグレーションファイルのSQL構文を確認
- 既に適用済みのマイグレーションを再適用しようとしていないか確認

詳細は [TURSO_SETUP.md](./TURSO_SETUP.md) を参照してください。

## 今後の拡張

- 認証機能の追加（JWT、OAuth等）
- レプリケーション設定の最適化
- パフォーマンス監視
- バックアップ戦略
