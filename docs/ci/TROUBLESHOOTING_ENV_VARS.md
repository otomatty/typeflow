# 環境変数のトラブルシューティングガイド

このドキュメントでは、Cloudflare Workersで環境変数が正しく読み込まれない問題の解決方法を説明します。

## エラー: "TURSO_DATABASE_URL is not configured"

このエラーは、Cloudflare Workersで `TURSO_DATABASE_URL` 環境変数が正しく設定されていない場合に発生します。

## 確認手順

### 1. Cloudflare Dashboardで環境変数を確認

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. **Workers & Pages** → **Workers** → **`typeflow-api`** を選択
3. **Settings** タブを開く
4. **Variables** セクションで以下を確認：
   - `TURSO_DATABASE_URL` が存在するか
   - 値が正しく設定されているか（`libsql://` で始まるか）
   - タイプが正しいか（**テキスト**）

### 2. 環境変数名の確認

環境変数名は大文字小文字を含めて正確に設定されているか確認してください：

- ✅ 正しい: `TURSO_DATABASE_URL`
- ❌ 間違った: `turso_database_url`
- ❌ 間違った: `Turso_Database_Url`

### 3. 値の確認

環境変数の値に以下がないか確認してください：

- 余分なスペース（先頭・末尾）
- 改行文字
- 引用符（`"` や `'`）が含まれていないか

**正しい形式**: `libsql://your-database-name-your-org.turso.io`

### 4. 再デプロイの実行

環境変数を設定・変更した後は、**必ず再デプロイ**を実行してください。

#### 方法A: GitHub Actionsで手動デプロイ

1. GitHubリポジトリの **Actions** タブに移動
2. **Deploy to Cloudflare** ワークフローを選択
3. **Run workflow** ボタンをクリック
4. ブランチを選択して **Run workflow** をクリック

#### 方法B: mainブランチにプッシュ

```bash
git push origin main
```

これにより自動デプロイがトリガーされます。

### 5. デプロイ履歴の確認

1. Cloudflare Dashboard → **Workers & Pages** → **Workers** → **`typeflow-api`**
2. **Deployments** タブを開く
3. 最新のデプロイが成功しているか確認
4. デプロイ時刻が環境変数を設定した時刻より後か確認

### 6. Workerのログを確認

1. Cloudflare Dashboard → **Workers & Pages** → **Workers** → **`typeflow-api`**
2. **Logs** タブを開く
3. エラーメッセージや警告を確認

## よくある問題と解決方法

### 問題1: 環境変数が設定されているのに読み込まれない

**原因**: デプロイが環境変数の設定より前に行われた

**解決方法**:

1. 環境変数を再設定（一度削除して再追加）
2. 再デプロイを実行

### 問題2: 環境変数の値が空になっている

**原因**: 値のコピー時にスペースや改行が含まれている

**解決方法**:

1. 環境変数を削除
2. 値を再度コピー（余分なスペースや改行がないか確認）
3. 環境変数を再設定
4. 再デプロイを実行

### 問題3: シークレットタイプの環境変数が読み込まれない

**原因**: シークレットタイプの環境変数は、設定後に再デプロイが必要

**解決方法**:

1. シークレットタイプの環境変数を設定
2. **必ず再デプロイを実行**

### 問題4: wrangler.tomlの設定が環境変数を上書きしている

**原因**: `wrangler.toml` の `[env.production.vars]` セクションが空でない場合、Cloudflare Dashboardの設定が上書きされる可能性がある

**解決方法**:

1. `wrangler.toml` を確認
2. `[env.production.vars]` セクションが空またはコメントアウトされているか確認
3. 環境変数はCloudflare Dashboardで設定することを推奨

## 環境変数の設定手順（再確認）

### Cloudflare Workers

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. **Workers & Pages** → **Workers** → **`typeflow-api`** を選択
3. **Settings** → **Variables** セクション
4. 以下の環境変数を設定：

   **`TURSO_DATABASE_URL`**
   - Type: **テキスト**
   - Value: `libsql://your-database-name-your-org.turso.io`

   **`TURSO_AUTH_TOKEN`**
   - Type: **シークレット** ⚠️
   - Value: `your-auth-token`

   **`CLERK_SECRET_KEY`**
   - Type: **シークレット** ⚠️
   - Value: `sk_live_...` または `sk_test_...`

5. **Save** をクリック
6. **必ず再デプロイを実行**

## デバッグ方法

### 1. Workerのログを確認

```bash
# Wrangler CLIを使用してログを確認
wrangler tail typeflow-api
```

### 2. 環境変数の値を確認（デバッグ用）

一時的に環境変数の値をログに出力して確認：

```typescript
// src/server/index.ts の fetch 関数内
console.log('TURSO_DATABASE_URL:', env.TURSO_DATABASE_URL)
console.log('TURSO_AUTH_TOKEN:', env.TURSO_AUTH_TOKEN ? '***' : 'not set')
```

**注意**: 本番環境では機密情報をログに出力しないでください。

### 3. ヘルスチェックエンドポイントを確認

```bash
curl https://typeflow-api.saedgewell.workers.dev/health
```

正常な場合は `200 OK` が返されます。

## チェックリスト

環境変数の問題を解決するためのチェックリスト：

- [ ] Cloudflare Dashboardで環境変数が設定されているか確認
- [ ] 環境変数名が正確か確認（大文字小文字を含めて）
- [ ] 環境変数の値が正しいか確認（余分なスペースや改行がないか）
- [ ] 環境変数のタイプが正しいか確認（テキスト/シークレット）
- [ ] 環境変数を設定した後に再デプロイを実行したか
- [ ] 最新のデプロイが成功しているか確認
- [ ] Workerのログでエラーがないか確認
- [ ] `wrangler.toml` の設定が環境変数を上書きしていないか確認

## 参考資料

- [環境変数設定ガイド](./ENVIRONMENT_VARIABLES.md)
- [デプロイ設定ガイド](./DEPLOYMENT_SETUP.md)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
