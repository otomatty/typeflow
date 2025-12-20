# Workersデプロイのトラブルシューティング

このドキュメントでは、Cloudflare Workersが自動デプロイされない問題の解決方法を説明します。

## 問題: Pagesは更新されたがWorkersが更新されない

### 確認手順

#### 1. GitHub Actionsのワークフロー実行状況を確認

1. GitHubリポジトリの **Actions** タブに移動
2. **Deploy to Cloudflare** ワークフローを選択
3. 最新の実行履歴を確認：
   - ✅ **緑色のチェックマーク**: デプロイが成功
   - ❌ **赤色のX**: デプロイが失敗
   - ⏸️ **黄色の丸**: デプロイが進行中または保留中

#### 2. Workersのデプロイステップを確認

1. 最新のワークフロー実行をクリック
2. **Deploy to Cloudflare Workers** ジョブを展開
3. 各ステップの実行結果を確認：
   - **Checkout**: ✅ 成功
   - **Setup Bun**: ✅ 成功
   - **Install dependencies**: ✅ 成功
   - **Run type check**: ✅ 成功
   - **Deploy to Cloudflare Workers**: ❓ ここで失敗していないか確認

#### 3. エラーログを確認

**Deploy to Cloudflare Workers** ステップでエラーが発生している場合：

1. エラーメッセージを確認
2. よくあるエラーと解決方法を参照（下記）

## よくある問題と解決方法

### 問題1: ワークフローが実行されていない

**症状**: GitHub Actionsの **Actions** タブにワークフローが表示されない

**原因**:

- ワークフローファイルが正しくコミットされていない
- `.github/workflows/deploy.yml` が存在しない

**解決方法**:

1. `.github/workflows/deploy.yml` が存在するか確認
2. ファイルが正しくコミットされているか確認
3. `main`ブランチにプッシュされているか確認

### 問題2: Workersのデプロイステップでエラーが発生

**症状**: **Deploy to Cloudflare Workers** ステップでエラーが表示される

**よくあるエラー**:

#### エラーA: "CLOUDFLARE_API_TOKEN is not set"

**解決方法**:

1. GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions** に移動
2. `CLOUDFLARE_API_TOKEN` が設定されているか確認
3. 設定されていない場合は追加

#### エラーB: "No environment found in configuration with name 'production'"

**解決方法**:

1. `wrangler.toml` に `[env.production]` セクションが存在するか確認
2. 存在しない場合は追加（空でOK）

#### エラーC: "bunx: command not found"

**解決方法**:

1. **Setup Bun** ステップが成功しているか確認
2. Bunのバージョンが正しく設定されているか確認

### 問題3: デプロイは成功しているが、Cloudflare Dashboardで更新されていない

**症状**: GitHub Actionsでは成功しているが、Cloudflare Dashboardで最新のデプロイが表示されない

**解決方法**:

1. Cloudflare Dashboard → **Workers & Pages** → **Workers** → **`typeflow-api`** を選択
2. **Deployments** タブを確認
3. 最新のデプロイが表示されているか確認
4. 表示されていない場合は、手動で再デプロイを実行

### 問題4: 型チェックでエラーが発生してデプロイが停止

**症状**: **Run type check** ステップでエラーが発生

**解決方法**:

1. ローカルで `bun run typecheck` を実行してエラーを確認
2. 型エラーを修正
3. 修正をコミットしてプッシュ

## 手動デプロイの実行

GitHub Actionsが正しく動作しない場合、手動でデプロイを実行できます。

### 方法1: GitHub Actionsから手動実行

1. GitHubリポジトリの **Actions** タブに移動
2. 左側のメニューから **Deploy to Cloudflare** を選択
3. **Run workflow** ボタンをクリック
4. ブランチを選択（通常は `main`）
5. **Run workflow** をクリック

### 方法2: Wrangler CLIで直接デプロイ

ローカル環境でWrangler CLIを使用してデプロイ：

```bash
# Wranglerにログイン
bunx wrangler login

# デプロイ
bunx wrangler deploy --env production
```

**注意**: この方法では、環境変数はCloudflare Dashboardで設定したものが使用されます。

## デプロイの確認方法

### 1. Cloudflare Dashboardで確認

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. **Workers & Pages** → **Workers** → **`typeflow-api`** を選択
3. **Deployments** タブを確認
4. 最新のデプロイの時刻とステータスを確認

### 2. Workerのログで確認

1. Cloudflare Dashboard → **Workers & Pages** → **Workers** → **`typeflow-api`**
2. **Logs** タブを開く
3. 最新のリクエストログを確認

### 3. ヘルスチェックエンドポイントで確認

```bash
curl https://typeflow-api.saedgewell.workers.dev/health
```

正常な場合は `{"status":"ok","timestamp":"..."}` が返されます。

## チェックリスト

Workersが更新されない問題を解決するためのチェックリスト：

- [ ] GitHub Actionsのワークフローが実行されているか確認
- [ ] **Deploy to Cloudflare Workers** ジョブが成功しているか確認
- [ ] エラーログがないか確認
- [ ] 必要なGitHubシークレットが設定されているか確認
  - [ ] `CLOUDFLARE_API_TOKEN`
  - [ ] `CLOUDFLARE_ACCOUNT_ID`
  - [ ] `TURSO_DATABASE_URL`
  - [ ] `TURSO_AUTH_TOKEN`
  - [ ] `CLERK_SECRET_KEY`
- [ ] `wrangler.toml` に `[env.production]` セクションが存在するか確認
- [ ] Cloudflare Dashboardで最新のデプロイが表示されているか確認
- [ ] 型チェックが成功しているか確認（`bun run typecheck`）

## 参考資料

- [環境変数設定ガイド](./ENVIRONMENT_VARIABLES.md)
- [デプロイ設定ガイド](./DEPLOYMENT_SETUP.md)
- [環境変数のトラブルシューティング](./TROUBLESHOOTING_ENV_VARS.md)
