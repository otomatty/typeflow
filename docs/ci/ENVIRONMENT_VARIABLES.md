# 環境変数設定ガイド

このドキュメントでは、Cloudflare PagesとWorkersで設定する必要がある環境変数について説明します。

## 目次

- [Cloudflare Workers（バックエンド）の環境変数](#cloudflare-workersバックエンドの環境変数)
- [Cloudflare Pages（フロントエンド）の環境変数](#cloudflare-pagesフロントエンドの環境変数)
- [設定手順](#設定手順)
- [環境変数の確認方法](#環境変数の確認方法)
- [トラブルシューティング](#トラブルシューティング)

---

## Cloudflare Workers（バックエンド）の環境変数

Cloudflare Workersで設定する必要がある環境変数は以下の通りです。

### 必須の環境変数

#### 1. `TURSO_DATABASE_URL`

**説明**: TursoデータベースのURL

**値の形式**: `libsql://your-database-name-your-org.turso.io`

**取得方法**:

**方法A: Turso CLIを使用（推奨）**

```bash
turso db show your-database-name --url
```

**方法B: Turso Dashboardを使用**

1. [Turso Dashboard](https://turso.tech/)にログイン
2. データベース一覧から対象のデータベースを選択
3. データベースの詳細ページで **"Connection"** または **"Connect"** セクションを確認
4. **"Database URL"** をコピー

**例**: `libsql://typeflow-db-your-org.turso.io`

---

#### 2. `TURSO_AUTH_TOKEN`

**説明**: Tursoデータベースの認証トークン（リモートデータベースの場合に必須）

**値の形式**: 長い文字列（例: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`）

**取得方法**:

**方法A: Turso CLIを使用（推奨）**

```bash
turso db tokens create your-database-name
```

**重要**: トークンは一度しか表示されません。必ず安全な場所にコピーして保存してください。

**方法B: Turso Dashboardを使用**

1. [Turso Dashboard](https://turso.tech/)にログイン
2. データベース一覧から対象のデータベースを選択
3. データベースの詳細ページで **"Tokens"** または **"API Tokens"** セクションを確認
4. **"Create Token"** をクリック
5. トークン名を入力（例: `production-token`）
6. 必要に応じて権限を設定（読み書き用または読み取り専用）
7. 生成されたトークンをコピーして保存

**注意**: ローカルデータベース（`file:`スキーム）を使用する場合は不要です。

---

#### 3. `CLERK_SECRET_KEY`

**説明**: Clerk認証のシークレットキー（認証を使用する場合に必須）

**値の形式**:

- 開発環境: `sk_test_...`
- 本番環境: `sk_live_...`

**取得方法**:

1. [Clerk Dashboard](https://dashboard.clerk.com/)にログイン
2. アプリケーションを選択
3. 左メニューから **"API Keys"** を選択
4. **"Development"** タブ（開発環境）または **"Production"** タブ（本番環境）を選択
5. **"Secret key"** をコピー

**重要**:

- 本番環境では必ず `sk_live_...` を使用してください
- 開発環境では `sk_test_...` を使用できます

**参考**: 詳細は [CLERK_PRODUCTION_SETUP.md](../auth/CLERK_PRODUCTION_SETUP.md) を参照してください。

---

### オプションの環境変数

#### 4. `ALLOWED_ORIGINS`

**説明**: CORS許可オリジン（カンマ区切り）

**値の形式**: `https://typeflow.pages.dev` または `https://typeflow.pages.dev,https://www.typeflow.com`

**デフォルト値**: `*`（すべてのオリジンを許可）

**設定例**:

- 単一オリジン: `https://typeflow.pages.dev`
- 複数オリジン: `https://typeflow.pages.dev,https://www.typeflow.com`

**注意**: 本番環境では、セキュリティのため特定のオリジンのみを許可することを推奨します。

---

## Cloudflare Pages（フロントエンド）の環境変数

Cloudflare Pagesで設定する必要がある環境変数は以下の通りです。

### 必須の環境変数

#### 1. `VITE_CLERK_PUBLISHABLE_KEY`

**説明**: Clerk認証のPublishable Key（フロントエンド用）

**値の形式**:

- 開発環境: `pk_test_...`
- 本番環境: `pk_live_...`

**取得方法**:

1. [Clerk Dashboard](https://dashboard.clerk.com/)にログイン
2. アプリケーションを選択
3. 左メニューから **"API Keys"** を選択
4. **"Development"** タブ（開発環境）または **"Production"** タブ（本番環境）を選択
5. **"Publishable key"** をコピー

**重要**:

- Viteプロジェクトでは、環境変数名に `VITE_` プレフィックスが必要です
- 本番環境では必ず `pk_live_...` を使用してください
- 開発環境では `pk_test_...` を使用できます

**参考**: 詳細は [CLERK_PRODUCTION_SETUP.md](../auth/CLERK_PRODUCTION_SETUP.md) を参照してください。

---

#### 2. `VITE_API_BASE_URL`

**説明**: フロントエンドからアクセスするAPIのベースURL

**値の形式**: `https://typeflow-api.your-subdomain.workers.dev/api`

**取得方法**:

**方法A: Cloudflare Workersをデプロイした後**

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. **Workers & Pages** → **Workers** に移動
3. デプロイしたWorker（例: `typeflow-api`）をクリック
4. Workerの詳細ページで **"Trigger"** または **"Quick edit"** セクションを確認
5. **"Workers URL"** または **"Route"** に表示されているURLをコピー
6. このURLに `/api` を追加して `VITE_API_BASE_URL` として設定

**方法B: Wrangler CLIでデプロイした場合**

```bash
wrangler deploy
```

デプロイ成功後、出力にWorkersのURLが表示されます（例: `https://typeflow-api.your-subdomain.workers.dev`）
このURLに `/api` を追加して `VITE_API_BASE_URL` として設定します。

**方法C: wrangler.tomlから推測**

- `wrangler.toml` の `name` フィールド（例: `typeflow-api`）とサブドメインから推測可能
- 形式: `https://{name}.{subdomain}.workers.dev/api`
- 例: `name = "typeflow-api"` でサブドメインが `your-subdomain` の場合
- URL: `https://typeflow-api.your-subdomain.workers.dev/api`

**例**: `https://typeflow-api.saedgewell.workers.dev/api`

**注意**: WorkersのURLは初回デプロイ後に確定します。デプロイ前に設定する場合は、予想されるURLを設定してください。

---

## 設定手順

### Cloudflare Workersの環境変数設定

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. 左メニューから **"Workers & Pages"** → **"Workers"** を選択
3. **`typeflow-api`** Workerをクリック
4. **"Settings"** タブを開く
5. **"Variables"** セクションまでスクロール
6. **"Add variable"** をクリック
7. 以下の環境変数を追加：

   **`TURSO_DATABASE_URL`**
   - **Variable name**: `TURSO_DATABASE_URL`
   - **Type**: **テキスト**
   - **Value**: `libsql://your-database-name-your-org.turso.io`

   **`TURSO_AUTH_TOKEN`**
   - **Variable name**: `TURSO_AUTH_TOKEN`
   - **Type**: **シークレット** ⚠️ 機密情報のため必ずシークレットを選択
   - **Value**: `your-auth-token`

   **`CLERK_SECRET_KEY`**
   - **Variable name**: `CLERK_SECRET_KEY`
   - **Type**: **シークレット** ⚠️ 機密情報のため必ずシークレットを選択
   - **Value**: `sk_live_...`（本番環境）または `sk_test_...`（開発環境）

   **`ALLOWED_ORIGINS`**（オプション）
   - **Variable name**: `ALLOWED_ORIGINS`
   - **Type**: **テキスト**
   - **Value**: `https://typeflow.pages.dev`

8. 各環境変数を追加したら **"Save"** をクリック

### Cloudflare Pagesの環境変数設定

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. 左メニューから **"Workers & Pages"** → **"Pages"** を選択
3. **`typeflow`** プロジェクトをクリック
4. **"Settings"** タブを開く
5. **"Environment variables"** セクションまでスクロール
6. **"Add variable"** をクリック
7. 以下の環境変数を追加：

   **`VITE_CLERK_PUBLISHABLE_KEY`**
   - **Variable name**: `VITE_CLERK_PUBLISHABLE_KEY`
   - **Type**: **テキスト**（Publishable Keyは公開しても問題ないため）
   - **Value**: `pk_live_...`（本番環境）または `pk_test_...`（開発環境）

   **`VITE_API_BASE_URL`**
   - **Variable name**: `VITE_API_BASE_URL`
   - **Type**: **テキスト**
   - **Value**: `https://typeflow-api.your-subdomain.workers.dev/api`

8. 各環境変数を追加したら **"Save"** をクリック

**重要**: 環境変数を設定した後、再デプロイが必要です。

---

## 環境変数の確認方法

### Cloudflare Workers

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. **Workers & Pages** → **Workers** → **`typeflow-api`** を選択
3. **Settings** → **Variables** セクションで環境変数を確認

### Cloudflare Pages

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. **Workers & Pages** → **Pages** → **`typeflow`** を選択
3. **Settings** → **Environment variables** セクションで環境変数を確認

---

## 環境変数のタイプについて

Cloudflareで環境変数を設定する際、以下の3つのタイプから選択できます：

1. **テキスト**: 一般的な文字列データ（URL、設定値など、機密性の低い情報）
2. **JSON**: 構造化されたデータ（このプロジェクトでは使用しません）
3. **シークレット**: 機密情報（APIキー、パスワード、トークンなど）

**重要**: 機密情報は必ず **シークレット** タイプを選択してください。シークレットとして保存されたデータは、Cloudflareのダッシュボード上でマスクされ、セキュリティが強化されます。

---

## 環境変数の一覧表

### Cloudflare Workers（バックエンド）

| 環境変数名           | 必須 | タイプ           | 説明                        | 例                                        |
| -------------------- | ---- | ---------------- | --------------------------- | ----------------------------------------- |
| `TURSO_DATABASE_URL` | ✅   | **テキスト**     | TursoデータベースのURL      | `libsql://typeflow-db-org.turso.io`       |
| `TURSO_AUTH_TOKEN`   | ✅   | **シークレット** | Turso認証トークン           | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `CLERK_SECRET_KEY`   | ✅   | **シークレット** | Clerk認証のシークレットキー | `sk_live_...` または `sk_test_...`        |
| `ALLOWED_ORIGINS`    | ⚠️   | **テキスト**     | CORS許可オリジン            | `https://typeflow.pages.dev`              |

### Cloudflare Pages（フロントエンド）

| 環境変数名                   | 必須 | タイプ       | 説明                       | 例                                               |
| ---------------------------- | ---- | ------------ | -------------------------- | ------------------------------------------------ |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅   | **テキスト** | Clerk認証のPublishable Key | `pk_live_...` または `pk_test_...`               |
| `VITE_API_BASE_URL`          | ✅   | **テキスト** | APIのベースURL             | `https://typeflow-api.subdomain.workers.dev/api` |

**注意**:

- `VITE_CLERK_PUBLISHABLE_KEY` は **テキスト** タイプを使用します（Publishable Keyは公開しても問題ないため）
- `CLERK_SECRET_KEY` は **シークレット** タイプを使用します（機密情報のため）

---

## トラブルシューティング

### 環境変数が反映されない

1. **再デプロイを実行**
   - 環境変数を設定した後、必ず再デプロイを実行してください
   - GitHub Actionsで手動デプロイを実行するか、`main`ブランチにプッシュ

2. **環境変数名の確認**
   - 大文字小文字を含めて正確に設定されているか確認
   - Pagesの環境変数は `VITE_` プレフィックスが必要

3. **値の確認**
   - 値に余分なスペースや改行が含まれていないか確認
   - 特にトークンやURLの末尾にスペースがないか確認

### 認証エラーが発生する

1. **APIキーの確認**
   - 開発環境では `sk_test_` / `pk_test_` を使用
   - 本番環境では `sk_live_` / `pk_live_` を使用
   - 環境に応じた正しいキーを使用しているか確認

2. **Clerkの設定確認**
   - Clerk Dashboardで本番インスタンスが作成されているか確認
   - Application domainが正しく設定されているか確認

### データベース接続エラーが発生する

1. **TURSO_DATABASE_URLの確認**
   - URLが `libsql://` で始まっているか確認
   - データベース名と組織名が正しいか確認

2. **TURSO_AUTH_TOKENの確認**
   - トークンが正しく設定されているか確認
   - トークンの有効期限が切れていないか確認

### CORSエラーが発生する

1. **ALLOWED_ORIGINSの確認**
   - PagesのURLが正しく設定されているか確認
   - 複数のオリジンを設定する場合は、カンマ区切りで設定

2. **VITE_API_BASE_URLの確認**
   - WorkersのURLが正しいか確認
   - URLの末尾に `/api` が含まれているか確認

---

## 参考資料

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Turso Documentation](https://docs.turso.tech/)
- [Clerk Documentation](https://clerk.com/docs)
- [CLERK_PRODUCTION_SETUP.md](../auth/CLERK_PRODUCTION_SETUP.md) - Clerk本番環境セットアップ
- [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md) - デプロイ設定ガイド

---

## チェックリスト

### Cloudflare Workersの環境変数設定

- [ ] `TURSO_DATABASE_URL` を設定（タイプ: **テキスト**）
- [ ] `TURSO_AUTH_TOKEN` を設定（タイプ: **シークレット** ⚠️）
- [ ] `CLERK_SECRET_KEY` を設定（タイプ: **シークレット** ⚠️、本番環境の場合は `sk_live_...`）
- [ ] `ALLOWED_ORIGINS` を設定（タイプ: **テキスト**、オプション、推奨）

### Cloudflare Pagesの環境変数設定

- [ ] `VITE_CLERK_PUBLISHABLE_KEY` を設定（タイプ: **テキスト**、本番環境の場合は `pk_live_...`）
- [ ] `VITE_API_BASE_URL` を設定（タイプ: **テキスト**、WorkersのURL + `/api`）

### デプロイ後の確認

- [ ] 環境変数が正しく設定されているか確認
- [ ] 再デプロイを実行
- [ ] アプリケーションが正常に動作するか確認
- [ ] 認証が正常に動作するか確認
- [ ] データベース接続が正常に動作するか確認
