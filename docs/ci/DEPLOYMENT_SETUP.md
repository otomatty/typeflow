# デプロイ設定ガイド

このドキュメントでは、Cloudflareへの自動デプロイを設定する方法を説明します。

## 必要なシークレットの設定

GitHubリポジトリに以下のシークレットを設定する必要があります。

### Cloudflare関連

1. **CLOUDFLARE_API_TOKEN**
   - Cloudflare APIトークン（アカウント所有トークン）
   - 作成方法:
     1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
     2. 右上のプロフィールアイコンをクリック → **"My Profile"** を選択
     3. 左側のメニューから **"API Tokens"** タブを開く
     4. **"Create Token"** をクリック
     5. 以下の2つの方法から選択できます:

        **方法A: テンプレートを使用（推奨）**
        - 提供されているテンプレートから **"Edit Cloudflare Workers"** を選択
        - このテンプレートにはWorkersのデプロイに必要な権限が含まれています
        - 必要に応じて、**"Edit Cloudflare Pages"** テンプレートも追加で選択
        - テンプレートを選択後、**"Continue to summary"** に進みます

        **方法B: カスタムトークンを作成**
        - **"Create Custom Token"** セクションで **"Get started"** をクリック
        - **Token name** に分かりやすい名前を入力（例: `TypeFlow CI/CD Deployment Token`）
        - **Permissions（権限）** セクションで **"Add"** をクリック
        - 権限の追加画面で、以下の手順で権限を設定:
          1. **"Account"** カテゴリを選択
          2. 表示される権限リストから、**Workers** に関連する項目を探して選択
             - 権限名はUIによって異なる場合があります（例: "Workers", "Workers Scripts", "Cloudflare Workers" など）
             - デプロイに必要な権限を選択し、**"Edit"** を選択
          3. 同様に、**Pages** に関連する項目を探して選択
             - 権限名はUIによって異なる場合があります（例: "Pages", "Cloudflare Pages" など）
             - デプロイに必要な権限を選択し、**"Edit"** を選択
          4. 必要に応じて、アカウント情報の読み取り権限を追加（オプション）

        **重要**:
        - 実際のUIで表示される権限名は、Cloudflareダッシュボードのバージョンや言語設定によって異なる場合があります
        - **Account** カテゴリ内で **Workers** と **Pages** に関連する項目を探してください
        - 権限が正しく設定されているかは、後でトークンの詳細画面で確認できます

     6. **Account resources** セクションで（カスタムトークンの場合）:
        - **Include** を選択
        - 対象のアカウントを選択（通常は1つのアカウントのみ）
     7. **Zone resources** は設定不要（WorkersとPagesはアカウントレベルで管理されるため）
     8. 必要に応じて、**Client IP Address Filtering** や **TTL (Time To Live)** を設定（オプション）
     9. **"Continue to summary"** をクリックして設定内容を確認
     10. 問題がなければ **"Create Token"** をクリック
     11. **重要**: 生成されたトークンは一度しか表示されません。必ず安全な場所にコピーして保存してください
     12. GitHubシークレットに設定
   - 参考:
     - [Cloudflare API Tokens - Account-owned tokens](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/)
     - [Create API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)

2. **CLOUDFLARE_ACCOUNT_ID**
   - CloudflareアカウントID
   - 取得方法:
     1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
     2. 右サイドバーのアカウント名の横にあるメニュー（歯車アイコン）をクリック
     3. **"Copy Account ID"** を選択してアカウントIDをコピー
     4. または、任意のゾーンの **"Overview"** ページの右サイドバーからも確認可能
     5. GitHubシークレットに設定

3. **CLOUDFLARE_SUBDOMAIN** (オプション)
   - Workersのサブドメイン
   - 例: `your-subdomain`
   - ヘルスチェックで使用（設定しない場合は警告のみ表示）

4. **CLOUDFLARE_WORKER_URL** (オプション)
   - Workersの完全なURL
   - 例: `https://typeflow-api.your-subdomain.workers.dev`
   - ヘルスチェックで使用（設定しない場合は自動生成）

### データベース関連

5. **TURSO_DATABASE_URL**
   - TursoデータベースのURL
   - 例: `libsql://your-database.turso.io`
   - 本番環境のTursoデータベースURLを設定

6. **TURSO_AUTH_TOKEN**
   - Tursoデータベースの認証トークン
   - 取得方法:
     ```bash
     turso db tokens create your-database-name
     ```
   - 本番環境用のトークンを設定

### 認証関連

7. **CLERK_SECRET_KEY**
   - Clerk認証のシークレットキー
   - [Clerk Dashboard](https://dashboard.clerk.com/)から取得
   - 本番環境用のシークレットキーを設定

### フロントエンド関連

8. **VITE_API_BASE_URL**
   - フロントエンドからアクセスするAPIのベースURL
   - 例: `https://typeflow-api.your-subdomain.workers.dev/api`
   - Cloudflare Pagesのビルド時に使用

## GitHubシークレットの設定方法

1. GitHubリポジトリにアクセス
2. **Settings** → **Secrets and variables** → **Actions** に移動
3. **"New repository secret"** をクリック
4. **Name** にシークレット名（例: `CLOUDFLARE_API_TOKEN`）を入力
5. **Secret** に値を貼り付け
6. **"Add secret"** をクリック
7. 上記の各シークレットを同様の手順で追加

## デプロイワークフローの動作

### 自動デプロイ

- `main`ブランチへのプッシュ時に自動的にデプロイが実行されます
- デプロイは以下の順序で実行されます:
  1. バックエンド（Cloudflare Workers）のデプロイ
  2. デプロイ後のヘルスチェック
  3. フロントエンド（Cloudflare Pages）のデプロイ

### 手動デプロイ

- GitHub Actionsの **"Deploy to Cloudflare"** ワークフローから手動実行も可能です
- 手順:
  1. GitHubリポジトリの **"Actions"** タブに移動
  2. 左側のメニューから **"Deploy to Cloudflare"** を選択
  3. **"Run workflow"** ボタンをクリック
  4. ブランチを選択して **"Run workflow"** をクリック

## デプロイ前の確認事項

1. ✅ すべてのシークレットが設定されている
2. ✅ `wrangler.toml`の環境変数設定が正しい
3. ✅ Tursoデータベースが作成され、マイグレーションが適用されている
4. ✅ Clerk認証が設定されている
5. ✅ Cloudflare Pagesプロジェクトが作成されている（手動で作成するか、初回デプロイで自動作成）

## トラブルシューティング

### デプロイが失敗する場合

1. **シークレットの確認**
   - すべてのシークレットが正しく設定されているか確認
   - GitHub Actionsのログでシークレットが正しく読み込まれているか確認

2. **Cloudflare APIトークンの権限**
   - APIトークンに以下の権限が正しく設定されているか確認:
     - **Account** 配下で **Workers** に関連する権限が **Edit** に設定されているか
     - **Account** 配下で **Pages** に関連する権限が **Edit** に設定されているか
   - 権限の確認方法:
     1. [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)にアクセス
     2. 作成したトークンをクリックして詳細を確認
     3. **Permissions** セクションで上記の権限が表示されているか確認
   - トークンが正しいアカウントにスコープされているか確認
   - トークンの有効期限が切れていないか確認
   - 必要に応じて、トークンを再作成して権限を再設定

3. **Workersの制限**
   - Cloudflare Workersの無料プランの制限を確認
   - 必要に応じてプランをアップグレード
   - Workersの日次リクエスト制限やCPU時間制限を確認

4. **データベース接続**
   - TursoデータベースのURLとトークンが正しいか確認
   - データベースがアクセス可能か確認
   - Turso CLIで接続テストを実行: `turso db shell your-database-name`

5. **Wranglerの設定**
   - `wrangler.toml`の設定が正しいか確認
   - `account_id`が正しく設定されているか確認
   - 環境変数が正しく設定されているか確認

### ヘルスチェックが失敗する場合

- ヘルスチェックは警告のみで、デプロイは続行されます
- Workers URLが正しく設定されているか確認
- デプロイの伝播に時間がかかる場合があります（最大数分）

## 参考リンク

### Cloudflare公式ドキュメント

- [Cloudflare API Tokens - Account-owned tokens](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions for Cloudflare](https://developers.cloudflare.com/workers/ci-cd/github-actions/)

### その他のドキュメント

- [Turso Documentation](https://docs.turso.tech/)
- [Clerk Documentation](https://clerk.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
