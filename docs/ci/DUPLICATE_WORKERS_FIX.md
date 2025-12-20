# 重複Workerの解決方法

## 問題の状況

現在、Cloudflare Dashboardに以下の2つのWorkerが存在しています：

1. **`typeflow-api`** - `typeflow-api.saedgewell.workers.dev`（9分前に更新）
2. **`typeflow-api-production`** - `typeflow-api-production.saedgewell.workers.dev`（11分前に更新）

## 原因

以前、`wrangler deploy --env production`コマンドを使用していたため、Wranglerが`typeflow-api-production`という名前でWorkerを作成しました。

Wranglerの動作：

- `wrangler deploy` → `typeflow-api`にデプロイ（`wrangler.toml`の`name`フィールドを使用）
- `wrangler deploy --env production` → `typeflow-api-production`にデプロイ（環境名をサフィックスとして追加）

## 解決方法

### 1. 不要なWorkerを削除

`typeflow-api-production`は不要なので削除してください：

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. **Workers & Pages** → **Workers** → **`typeflow-api-production`** を選択
3. **Settings** タブを開く
4. ページの最下部までスクロール
5. **Delete** ボタンをクリック
6. 確認ダイアログで **Delete** をクリック

### 2. 正しいWorkerを使用

今後は **`typeflow-api`** のみを使用してください：

- **Worker名**: `typeflow-api`
- **URL**: `https://typeflow-api.saedgewell.workers.dev`
- **環境変数設定**: Cloudflare Dashboard → **Workers & Pages** → **Workers** → **`typeflow-api`** → **Settings** → **Variables**

### 3. 確認事項

- ✅ `wrangler.toml`の`name = "typeflow-api"`が正しく設定されている
- ✅ ワークフローで`--env production`オプションを削除済み
- ✅ 今後は`typeflow-api`にのみデプロイされる

## 現在の設定

### wrangler.toml

```toml
name = "typeflow-api"
main = "src/server/index.ts"
compatibility_date = "2024-11-06"
dev = { port = 3456 }

# [env.production]セクションは削除済み
# 環境変数はCloudflare Dashboardで設定
```

### GitHub Actionsワークフロー

```yaml
- name: Deploy to Cloudflare Workers
  run: bunx wrangler deploy
  # --env productionオプションは削除済み
```

## 今後のデプロイ

今後、GitHubにプッシュすると、`typeflow-api`にのみデプロイされます。

- ✅ 正しいWorker: `typeflow-api`
- ❌ 削除すべきWorker: `typeflow-api-production`

## 注意事項

- `typeflow-api-production`を削除しても、`typeflow-api`には影響しません
- 環境変数は`typeflow-api`に設定してください
- フロントエンドの`VITE_API_BASE_URL`は`https://typeflow-api.saedgewell.workers.dev/api`を使用してください
