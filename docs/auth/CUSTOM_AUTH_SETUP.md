# カスタム認証画面のセットアップ

## 概要

TypeFlowでは、ClerkのSDKを使用して完全にカスタマイズされた認証画面とプロフィール画面を実装しています。

## Clerkダッシュボードでの設定

### 1. 認証方法の有効化

1. [Clerk Dashboard](https://dashboard.clerk.com/)にログイン
2. **User & Authentication** → **Email, Phone, Username** を選択
3. 以下の設定を確認・変更:
   - **Email address**: 有効化
   - **Allow users to sign up**: 有効化（初回ログイン時にアカウントが自動的に作成されるようにするため）

### 2. OAuthプロバイダーの設定

#### Google認証

1. **User & Authentication** → **Social Connections** → **Google** を選択
2. **Enable Google** を有効化
3. Google OAuth認証情報を設定:
   - **Client ID**: Google Cloud Consoleから取得
   - **Client Secret**: Google Cloud Consoleから取得
4. **Redirect URLs** に以下を追加:
   - `http://localhost:5173` (開発環境)
   - 本番環境のURL

#### GitHub認証

1. **User & Authentication** → **Social Connections** → **GitHub** を選択
2. **Enable GitHub** を有効化
3. GitHub OAuth認証情報を設定:
   - **Client ID**: GitHub Developer Settingsから取得
   - **Client Secret**: GitHub Developer Settingsから取得
4. **Redirect URLs** に以下を追加:
   - `http://localhost:5173` (開発環境)
   - 本番環境のURL

### 3. パスワード設定

1. **User & Authentication** → **Email, Phone, Username** を選択
2. **Password** セクションで:
   - **Require password**: オプション（初回ログイン時にパスワードを空欄にできるようにするため）
   - または、**Passwordless** を有効化（メールリンク認証）

## 実装の特徴

### 認証画面

- **Google認証**: OAuthフローを使用
- **GitHub認証**: OAuthフローを使用
- **メール認証**: メールアドレスとパスワード（任意）でログイン
  - 初回ログイン時はパスワードを空欄にできる
  - アカウントが存在しない場合は自動的に作成される

### プロフィール画面

- **名前の編集**: フルネームとして保存（姓と名を分けない）
- **アバター表示**: Clerkのプロフィール画像を使用
- **認証方法の表示**: 接続されている認証方法を表示

## 注意事項

1. **初回ログイン時の自動アカウント作成**
   - Clerkの設定で「Allow users to sign up」を有効化する必要があります
   - これにより、存在しないメールアドレスでログインを試みた場合、自動的にアカウントが作成されます

2. **パスワードレス認証**
   - メール認証でパスワードを空欄にした場合、Clerkの設定によってはエラーになる可能性があります
   - パスワードレス認証を使用する場合は、Clerkの「Passwordless」設定を有効化してください

3. **OAuth認証のリダイレクトURL**
   - 開発環境と本番環境の両方のURLをClerkに登録する必要があります
   - リダイレクトURLが正しく設定されていない場合、OAuth認証が失敗します

## トラブルシューティング

### OAuth認証が失敗する場合

1. ClerkダッシュボードでOAuthプロバイダーが正しく設定されているか確認
2. リダイレクトURLが正しく設定されているか確認
3. ブラウザのコンソールでエラーメッセージを確認

### メール認証が失敗する場合

1. Clerkの設定で「Allow users to sign up」が有効化されているか確認
2. メールアドレスの形式が正しいか確認
3. パスワードが必要な場合は、パスワードを入力

### プロフィール更新が失敗する場合

1. ClerkのAPIキーが正しく設定されているか確認
2. ユーザーがログインしているか確認
3. ブラウザのコンソールでエラーメッセージを確認
