# 複数端末間でのデータ同期設定

TypeFlowアプリを複数の端末（PC、スマートフォン、Tauriデスクトップアプリなど）間でデータを共有するための設定方法です。

## 概要

現在、TypeFlowはローカルサーバー（Bun + SQLite）を使用してデータを管理しています。複数端末間でデータを共有するには、このサーバーをクラウドにデプロイする必要があります。

## 推奨される方法（低コスト）

### 1. Cloudflare Workers + D1（推奨）⭐

**無料枠**: 非常に寛大な無料枠（100,000リクエスト/日、5GB読み取り/日）

#### メリット
- グローバルに分散されたエッジコンピューティング（低レイテンシー）
- 非常に寛大な無料枠
- SQLite互換のD1データベース
- Honoフレームワークによる型安全なAPI
- 自動スケーリング
- データベースの永続化

#### デプロイ手順

1. **Cloudflareアカウントの作成**
   - [Cloudflare](https://dash.cloudflare.com/sign-up) にアカウントを作成

2. **Wrangler CLIのインストール確認**
   ```bash
   npm install -g wrangler
   # または
   bun add -g wrangler
   ```

3. **Cloudflareにログイン**
   ```bash
   wrangler login
   ```

4. **D1データベースの作成**
   ```bash
   # 本番環境用
   npm run db:create
   
   # 開発環境用
   npm run db:create:dev
   ```

5. **マイグレーションの実行**
   ```bash
   # 開発環境
   npm run db:migrate:dev
   
   # 本番環境
   npm run db:migrate
   ```

6. **wrangler.tomlの設定**
   - 作成されたデータベースIDを `wrangler.toml` の `database_id` に設定
   - `ALLOWED_ORIGINS` に許可するオリジンを設定

7. **デプロイ**
   ```bash
   # 開発環境
   npm run deploy
   
   # 本番環境
   npm run deploy:prod
   ```

8. **デプロイ完了後、提供されるURLをコピー**
   - 例: `https://typeflow-api.your-subdomain.workers.dev`

#### クライアント側の設定

各端末のアプリで、環境変数または設定ファイルに以下を設定：

```bash
VITE_API_BASE_URL=https://typeflow-api.your-subdomain.workers.dev/api
```

#### ローカル開発

```bash
# ローカルで開発サーバーを起動（D1ローカルデータベースを使用）
npm run dev:server
```

#### 注意事項

- D1データベースはリージョンごとにレプリケーションされるため、初回書き込み時に若干の遅延が発生する可能性があります
- 無料枠では、読み取りが5GB/日、書き込みが1GB/日まで
- 本番環境では、`ALLOWED_ORIGINS` を適切に設定してください

### 2. Railway

**無料枠**: $5/月のクレジット（通常は無料で十分）

#### メリット
- 簡単なデプロイ
- 自動スケーリング
- データベースの永続化
- 無料枠が充実

#### デプロイ手順

1. [Railway](https://railway.app) にアカウントを作成（GitHubアカウントでログイン可能）
2. 新しいプロジェクトを作成
3. 「New」→「GitHub Repo」を選択
4. リポジトリを選択
5. Railwayが自動的にBunを検出し、`railway.json`の設定を使用します
6. デプロイ完了後、提供されるURLをコピー（例: `https://your-app.railway.app`）

#### クライアント側の設定

各端末のアプリで、環境変数または設定ファイルに以下を設定：

```bash
VITE_API_BASE_URL=https://your-app.railway.app/api
```

### 2. Render

**無料枠**: 無料プランあり（15分間の非アクティブ後にスリープ）

#### メリット
- 無料プランあり
- シンプルな設定

#### デメリット
- スリープ時に初回リクエストが遅い
- 無料プランではデータが失われる可能性

#### デプロイ手順

1. [Render](https://render.com) にアカウントを作成
2. 新しいWebサービスを作成
3. GitHubリポジトリを接続
4. 設定：
   - **Build Command**: `bun install`
   - **Start Command**: `bun run server/index.ts`
   - **Environment**: `bun`
5. デプロイ完了後、提供されるURLをコピー（例: `https://your-app.onrender.com`）

#### クライアント側の設定

```bash
VITE_API_BASE_URL=https://your-app.onrender.com/api
```

### 3. その他の選択肢

- **Fly.io**: 無料枠あり、グローバル分散
- **Heroku**: 有料プランのみ（無料プラン廃止）
- **Vercel**: サーバーレス関数として実装が必要

## ローカル開発時の設定

### Cloudflare Workersを使用する場合

開発時は、Wranglerの開発サーバーを使用：

```bash
# Cloudflare Workers開発サーバー（D1ローカルデータベースを使用）
npm run dev:server
```

### 従来のBunサーバーを使用する場合

開発時は、`.env`ファイルをプロジェクトルートに作成して以下を設定：

```bash
VITE_API_BASE_URL=http://localhost:3456/api
```

または、環境変数を設定せずにデフォルト（`http://localhost:3456/api`）を使用できます。

#### サーバーの起動

```bash
# 通常起動
bun run server

# 開発モード（ファイル変更を監視）
bun run server:dev
```

## ブラウザアプリでの設定

### 開発環境

`.env`ファイルを作成：

```bash
VITE_API_BASE_URL=http://localhost:3456/api
```

### 本番環境

ビルド時に環境変数を設定：

```bash
VITE_API_BASE_URL=https://your-app.railway.app/api npm run build
```

または、`.env.production`ファイルを作成：

```bash
VITE_API_BASE_URL=https://your-app.railway.app/api
```

## Tauriアプリでの設定

Tauriアプリでは、以下の方法で設定できます：

### 方法1: 環境変数を使用

`src-tauri/tauri.conf.json`で環境変数を設定：

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  }
}
```

実行時に環境変数を設定：

```bash
VITE_API_BASE_URL=https://your-app.railway.app/api npm run tauri dev
```

### 方法2: 設定ファイルで管理

アプリ内で設定画面を追加し、ユーザーがAPI URLを設定できるようにする。

## セキュリティに関する注意事項

### Cloudflare Workersの場合

Cloudflare Workersでは、`wrangler.toml`の`ALLOWED_ORIGINS`環境変数でCORSを制御します。本番環境では、特定のドメインのみを許可するように設定してください：

```toml
[env.production.vars]
ALLOWED_ORIGINS = "https://your-app.vercel.app,https://your-app.netlify.app"
```

### その他のプラットフォーム

現在の実装では、CORSが全開放（`Access-Control-Allow-Origin: *`）になっている場合があります。本番環境では、以下の対策を推奨します：

### 1. 認証の追加

APIキーやユーザー認証を実装：

```typescript
// src/server/index.ts の例
// 認証ミドルウェアを使用
import { authMiddleware, requireAuth } from './auth'

app.use('/*', authMiddleware)
app.use('/api/*', requireAuth)
```

認証の実装については、`src/server/auth.ts`を参照してください。

### 2. CORSの制限

許可するオリジンを制限：

```typescript
// Cloudflare Workersの場合、wrangler.tomlで設定
// その他の場合、環境変数で設定
const allowedOrigins = [
  'https://your-app.vercel.app',
  'https://your-app.netlify.app',
  // Tauriアプリの場合は、カスタムスキームを許可
]

const origin = req.headers.get('Origin')
if (origin && allowedOrigins.includes(origin)) {
  corsHeaders['Access-Control-Allow-Origin'] = origin
}
```

### 3. レート制限

過度なリクエストを防止（例: express-rate-limit相当の実装）

## データベースの永続化

### Cloudflare D1

Cloudflare D1は自動的に永続化され、グローバルにレプリケーションされます。追加設定は不要です。データベースは以下のコマンドで管理できます：

```bash
# データベースの作成
npm run db:create

# マイグレーションの実行
npm run db:migrate

# ローカル開発用データベース
npm run db:create:dev
npm run db:migrate:dev
```

### Railway

Railwayは自動的にボリュームを提供し、`data/typeflow.db`ファイルを永続化します。追加設定は不要です。

### Render

Renderの無料プランでは、スリープ時にデータが失われる可能性があります。永続化が必要な場合は、以下のいずれかを使用：

1. **外部データベース**: PostgreSQL、MongoDBなど
2. **Render Disk**: 有料プランで利用可能

## トラブルシューティング

### 接続エラーが発生する場合

1. **サーバーが起動しているか確認**
   ```bash
   curl https://your-app.railway.app/api/words
   ```

2. **APIベースURLが正しく設定されているか確認**
   - ブラウザの開発者ツール（F12）→ Consoleで確認
   - `console.log(import.meta.env.VITE_API_BASE_URL)`

3. **CORS設定を確認**
   - ネットワークタブでエラーメッセージを確認

4. **ネットワーク接続を確認**
   - ファイアウォールやプロキシの設定を確認

### データが同期されない場合

1. **各端末で同じAPIベースURLを使用しているか確認**
2. **サーバーのログを確認**（RailwayやRenderのダッシュボード）
3. **ブラウザの開発者ツールでネットワークリクエストを確認**
   - リクエストが送信されているか
   - レスポンスが正しいか

### Railway特有の問題

- **ポート設定**: Railwayは自動的に`PORT`環境変数を設定します
- **データベースパス**: 相対パス（`../data/typeflow.db`）が正しく動作することを確認

### Render特有の問題

- **スリープ**: 無料プランでは15分間の非アクティブ後にスリープします
- **初回リクエスト**: スリープ後の初回リクエストは30秒程度かかる場合があります

## 今後の改善案

- [ ] ユーザー認証の実装（JWT、OAuthなど）
- [ ] オフライン対応（IndexedDBへのフォールバック）
- [ ] リアルタイム同期（WebSocket、Server-Sent Events）
- [ ] データの暗号化（エンドツーエンド暗号化）
- [ ] 競合解決（複数端末での同時編集）
- [ ] データのバックアップ・復元機能

## コスト比較

| サービス | 無料枠 | 有料プラン | 推奨度 |
|---------|--------|-----------|--------|
| Cloudflare Workers + D1 | 100,000リクエスト/日、5GB読み取り/日 | $5/月〜 | ⭐⭐⭐⭐⭐ |
| Railway | $5/月クレジット | $20/月〜 | ⭐⭐⭐⭐ |
| Render | 無料プランあり | $7/月〜 | ⭐⭐⭐ |
| Fly.io | 無料枠あり | $1.94/月〜 | ⭐⭐⭐ |

## 参考リンク

- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Bun Documentation](https://bun.sh/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

