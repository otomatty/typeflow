# Clerk本番環境セットアップガイド

このドキュメントでは、Clerkの本番環境設定とCloudflare Pagesとの連携方法を説明します。

## CLERK_SECRET_KEYの取得方法

### 開発環境 vs 本番環境

Clerkには2種類のAPIキーがあります：

- **`sk_test_...`** (開発/テスト用)
  - 開発環境で使用
  - 無料プランでも利用可能
  - テストデータが使用される

- **`sk_live_...`** (本番用)
  - 本番環境で使用
  - 実際のユーザーデータが使用される
  - 本番環境では必ずこちらを使用

### 取得手順

#### 開発環境用（`sk_test_`）

1. [Clerk Dashboard](https://dashboard.clerk.com/)にログイン
2. アプリケーションを選択
3. 左メニューから **「API Keys」** を選択
4. **「Development」** タブで **「Secret key」** をコピー
   - 形式: `sk_test_...`

#### 本番環境用（`sk_live_`）

1. [Clerk Dashboard](https://dashboard.clerk.com/)にログイン
2. アプリケーションを選択
3. 左メニューから **「API Keys」** を選択
4. **「Production」** タブで **「Secret key」** をコピー
   - 形式: `sk_live_...`
   - **重要**: 本番環境では必ず`sk_live_`を使用してください

### Publishable Keyの取得

フロントエンド用のPublishable Keyも同様に取得できます：

- **開発環境**: `pk_test_...`
- **本番環境**: `pk_live_...`

## 本番環境のドメイン設定

### 現時点でドメインがない場合の対応

Cloudflare Pagesを使用している場合、以下の方法で対応できます：

#### 方法1: Cloudflare Pagesのデフォルトドメインを使用（推奨）

1. **Cloudflare PagesのURLを確認**
   - [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
   - **Workers & Pages** → **Pages** → **`typeflow`** を選択
   - 表示されるURLを確認（例: `https://typeflow.pages.dev`）
   - **重要**: WorkersのURLではなく、**PagesのURL**を使用してください

2. **Clerkで本番インスタンスを作成**
   - **Application domain**: `https://typeflow.pages.dev`（末尾の`/`は付けない）
   - **重要**: URLの末尾に`/`を付けないでください（エラーになります）
   - このドメインを入力して本番インスタンスを作成

3. **Primary/Secondaryの選択**
   - **Primary application** を選択（通常はこちら）
   - 複数のアプリケーションを運用する場合は **Secondary application** を選択

4. **本番環境のAPIキーを取得**
   - `sk_live_...` と `pk_live_...` を取得

#### 方法2: 開発環境のまま進める（一時的な対応）

1. **開発環境のAPIキーを使用**
   - `sk_test_...` と `pk_test_...` を使用
   - 開発環境でも動作確認は可能

2. **後で本番環境に移行**
   - ドメインが準備できたら本番インスタンスを作成
   - 本番環境のAPIキーに切り替え

### カスタムドメインを使用する場合

独自ドメイン（例: `typeflow.com`）を使用する場合：

1. **Cloudflare Pagesでカスタムドメインを設定**
   - Cloudflare Dashboard → Pages → `typeflow` → **Custom domains**
   - カスタムドメインを追加

2. **Clerkで本番インスタンスを作成**
   - **Application domain**: `https://typeflow.com`（カスタムドメイン）

3. **ClerkのAllowed originsに追加**
   - Clerk Dashboard → **Settings** → **Paths**
   - **Allowed origins** に `https://typeflow.com` を追加

## 環境変数の設定

### Cloudflare Workers（バックエンド）

Cloudflare Dashboardで以下の環境変数を設定：

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. **Workers & Pages** → **Workers** → **`typeflow-api`** を選択
3. **Settings** → **Variables** セクション
4. 以下の環境変数を追加：
   - `CLERK_SECRET_KEY` = `sk_live_...`（本番環境の場合）

### Cloudflare Pages（フロントエンド）

Cloudflare Pagesの環境変数設定：

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. **Workers & Pages** → **Pages** → **`typeflow`** を選択
3. **Settings** → **Environment variables** セクション
4. 以下の環境変数を追加：
   - `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_...`（本番環境の場合）

**重要**: Viteプロジェクトでは、環境変数名に`VITE_`プレフィックスが必要です。

## 開発環境から本番環境への移行手順

### 1. Clerkで本番インスタンスを作成

1. Clerk Dashboardにログイン
2. **「Create production instance」** をクリック
3. **Application domain** に以下を入力：
   - Cloudflare Pagesのデフォルトドメイン: `https://typeflow.pages.dev`
   - またはカスタムドメイン: `https://your-domain.com`
4. 本番インスタンスを作成

### 2. 本番環境のAPIキーを取得

1. 本番インスタンスを選択
2. **API Keys** → **Production** タブ
3. `sk_live_...` と `pk_live_...` をコピー

### 3. 環境変数を更新

#### Cloudflare Workers

- `CLERK_SECRET_KEY` = `sk_live_...`（本番環境のキーに更新）

#### Cloudflare Pages

- `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_...`（本番環境のキーに更新）

### 4. 再デプロイ

環境変数を更新した後、再デプロイを実行：

1. GitHub Actionsで手動デプロイを実行
2. または、`main`ブランチにプッシュして自動デプロイ

## よくあるエラーと解決方法

### "Home url is invalid. cannot contain a path"

**原因**: URLの末尾に`/`が含まれている、またはパスが含まれている

**解決方法**:

- ✅ 正しい形式: `https://typeflow.pages.dev`
- ❌ 間違った形式: `https://typeflow.pages.dev/`（末尾の`/`が原因）
- ❌ 間違った形式: `https://typeflow.saedgewell.workers.dev/`（WorkersのURLではなく、PagesのURLを使用）

### WorkersのURLとPagesのURLの違い

- **WorkersのURL**: `https://typeflow-api.saedgewell.workers.dev`（バックエンドAPI用）
- **PagesのURL**: `https://typeflow.pages.dev`（フロントエンド用、ClerkのApplication domainに使用）

**重要**: ClerkのApplication domainには、**PagesのURL**を入力してください。

### Primary/Secondaryの選択について

- **Primary application**: 通常はこちらを選択
  - ClerkのAPIは `clerk.saedgewell.workers.dev` でホストされる
  - 検証メールは `@saedgewell.workers.dev` から送信される

- **Secondary application**: 複数のアプリケーションを運用する場合
  - ClerkのAPIは `clerk.typeflow.saedgewell.workers.dev` でホストされる
  - 検証メールは `@typeflow.saedgewell.workers.dev` から送信される

**推奨**: 通常は **Primary application** を選択してください。

## トラブルシューティング

### 認証エラーが発生する場合

1. **APIキーの確認**
   - 開発環境では`sk_test_`、本番環境では`sk_live_`を使用しているか確認
   - Publishable Keyも同様に確認

2. **ドメインの確認**
   - ClerkのAllowed originsに正しいドメインが設定されているか確認
   - CORS設定が正しいか確認

3. **環境変数の確認**
   - Cloudflare Dashboardで環境変数が正しく設定されているか確認
   - デプロイ後に環境変数が反映されているか確認

### 本番インスタンスが作成できない場合

1. **一時的に開発環境を使用**
   - 開発環境のAPIキー（`sk_test_`）を使用して動作確認
   - ドメインが準備できたら本番インスタンスを作成

2. **Cloudflare Pagesのデフォルトドメインを使用**
   - `https://typeflow.pages.dev` などのデフォルトドメインを使用
   - 後でカスタムドメインに変更可能

## セキュリティ注意事項

- **本番環境では必ず`sk_live_`を使用**
- **APIキーをGitにコミットしない**
- **環境変数を安全に管理**（Cloudflare Dashboardで設定）
- **HTTPSを有効化**（Cloudflare Pagesは自動でHTTPS対応）

## 参考資料

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Production Setup](https://clerk.com/docs/deployments/overview)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
