# TursoとClerk JWTの統合ガイド

このドキュメントでは、TursoデータベースでClerk JWTトークンを使用したマルチユーザーアクセス制御を実装する方法を説明します。

## 目次

- [概要](#概要)
- [前提条件](#前提条件)
- [ステップ1: TursoでJWT認証を有効化](#ステップ1-tursoでjwt認証を有効化)
- [ステップ2: ClerkでJWTテンプレートを設定](#ステップ2-clerkでjwtテンプレートを設定)
- [ステップ3: アプリケーションコードの変更](#ステップ3-アプリケーションコードの変更)
- [ステップ4: データベーススキーマの更新](#ステップ4-データベーススキーマの更新)
- [ステップ5: Row-Level Security (RLS) の実装](#ステップ5-row-level-security-rls-の実装)
- [トラブルシューティング](#トラブルシューティング)
- [参考資料](#参考資料)

---

## 概要

### 現在の構成

```
[フロントエンド] → [Clerk認証] → [バックエンド] → [Turso DB]
                                      ↑
                            TURSO_AUTH_TOKEN使用
```

### 目標の構成

```
[フロントエンド] → [Clerk認証] → [バックエンド] → [Turso DB]
                      ↓              ↑
                  JWT発行      Clerk JWTで認証
                                （ユーザーレベルアクセス制御）
```

### メリット

1. **セキュリティ強化**: データベースレベルでユーザー認証が行われる
2. **アクセス制御**: ユーザーごとにデータアクセスを制限可能
3. **監査**: データベースアクセスログにユーザー情報が含まれる
4. **一元管理**: Clerkで発行したJWTがそのままデータベース認証に使用できる

---

## 前提条件

- [x] Turso CLIがインストールされていること
- [x] Tursoアカウントがあること
- [x] Clerkアカウントがあること（本番環境設定済み）
- [x] TypeFlowアプリがデプロイ済みであること

---

## ステップ1: TursoでJWT認証を有効化

### 1.1 Turso CLIでログイン

```bash
turso auth login
```

### 1.2 データベースのグループを確認

Tursoでは、JWT認証はデータベースグループ単位で設定します。

```bash
# グループ一覧を表示
turso group list

# データベースが属するグループを確認
turso db show typeflow-db
```

### 1.3 JWT認証用のJWKS URLを設定

ClerkのJWKS（JSON Web Key Set）URLをTursoに登録します。

#### 方法A: Turso Dashboard（推奨）

1. [Turso Dashboard](https://app.turso.tech/) にログイン
2. 左メニューから **Settings** → **General** を選択
3. **JWKS Endpoints** セクションを確認
4. **Add JWKS Endpoint** をクリック
5. ClerkのJWKS URLを入力: `https://vast-whale-1.clerk.accounts.dev/.well-known/jwks.json`
6. 保存

**注意**: TypeFlowプロジェクトでは、すでにClerkのJWKS URLが登録されています：

```
https://vast-whale-1.clerk.accounts.dev/.well-known/jwks.json
```

#### 方法B: Turso CLI

```bash
# 注意: turso CLIのバージョンによってはこのコマンドが使えない場合があります
# その場合はDashboardから設定してください
turso org jwt-key add https://vast-whale-1.clerk.accounts.dev/.well-known/jwks.json
```

### 1.4 設定の確認

Turso Dashboard → Settings → General → JWKS Endpoints で、ClerkのURLが表示されていることを確認します。

---

## ステップ2: ClerkでJWTテンプレートを設定

Tursoが期待するクレーム（claims）を含むJWTを発行するため、Clerkでカスタムテンプレートを設定します。

### 2.1 Clerk Dashboardでテンプレートを作成

1. [Clerk Dashboard](https://dashboard.clerk.com/)にログイン
2. アプリケーションを選択
3. **Configure** → **JWT Templates** を選択
4. **New template** をクリック
5. **Blank** を選択

### 2.2 テンプレートの設定

**Name**: `turso`

**Claims** (JSON形式):

```json
{
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "name": "{{user.first_name}} {{user.last_name}}",
  "iat": "{{time.now}}",
  "exp": "{{time.now + 3600}}"
}
```

### 2.3 テンプレートの保存

**Save** をクリックしてテンプレートを保存します。

### 2.4 フロントエンドでカスタムトークンを取得

Clerkの`useAuth`フックで、カスタムテンプレートを指定してトークンを取得します。

```typescript
// src/hooks/useAuth.ts
import { useAuth as useClerkAuth } from '@clerk/clerk-react'

export function useAuth() {
  const { getToken, ...rest } = useClerkAuth()

  // Turso用のカスタムJWTを取得する関数
  const getTursoToken = async () => {
    return getToken({ template: 'turso' })
  }

  return {
    ...rest,
    getToken,
    getTursoToken, // Turso用のトークン取得関数を追加
  }
}
```

---

## ステップ3: アプリケーションコードの変更

### 3.1 フロントエンド: APIリクエストにTursoトークンを追加

`src/lib/db.ts`を更新して、Turso用のJWTトークンを送信するようにします。

```typescript
// src/lib/db.ts

// Turso用のトークン取得関数を設定
let getTursoToken: (() => Promise<string | null>) | null = null

export function setTursoTokenGetter(fn: () => Promise<string | null>) {
  getTursoToken = fn
}

// API呼び出し時にTursoトークンをヘッダーに追加
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }

  // ClerkのJWTトークンを取得してヘッダーに追加
  if (getClerkToken) {
    const token = await getClerkToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  // Turso用のJWTトークンを別ヘッダーで送信
  if (getTursoToken) {
    const tursoToken = await getTursoToken()
    if (tursoToken) {
      headers['X-Turso-Token'] = tursoToken
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}
```

### 3.2 App.tsxでトークン取得関数を設定

```typescript
// src/App.tsx
import { setClerkTokenGetter, setTursoTokenGetter } from '@/lib/db'

function App() {
  const { getToken } = useAuth()

  useEffect(() => {
    // 通常のClerkトークン
    setClerkTokenGetter(getToken)

    // Turso用のカスタムトークン
    setTursoTokenGetter(async () => {
      return getToken({ template: 'turso' })
    })
  }, [getToken])

  // ...
}
```

### 3.3 バックエンド: Tursoトークンを使用してデータベースに接続

`src/server/index.ts`を更新します。

```typescript
// src/server/index.ts

// データベースクライアントをリクエストごとに作成（Clerk JWTトークンを使用）
app.use('/*', async (c, next) => {
  const url = c.env.TURSO_DATABASE_URL

  if (!url) {
    await next()
    return
  }

  // ローカルデータベースの場合
  if (url.startsWith('file:')) {
    const filePath = url.replace(/^file:/, '')
    c.env.DB = createClient({
      url: `file:${filePath}`,
    })
    await next()
    return
  }

  // リモートTursoデータベースの場合
  // X-Turso-Tokenヘッダーからトークンを取得
  const tursoToken = c.req.header('X-Turso-Token')

  if (tursoToken) {
    // Clerk JWTトークンを使用してTursoに接続
    c.env.DB = createClient({
      url,
      authToken: tursoToken,
    })
  } else {
    // フォールバック: TURSO_AUTH_TOKENを使用
    const fallbackToken = c.env.TURSO_AUTH_TOKEN
    if (fallbackToken) {
      c.env.DB = createClient({
        url,
        authToken: fallbackToken,
      })
    }
  }

  await next()
})
```

---

## ステップ4: データベーススキーマの更新

マルチユーザー対応のため、すべてのテーブルに`user_id`カラムを追加します。

### 4.1 マイグレーションファイルの作成

`migrations/0007_add_user_id_constraint.sql`:

```sql
-- 既存のデータにuser_idを設定（必要に応じて調整）
-- 注意: 既存データがある場合は、適切なuser_idを設定してから制約を追加してください

-- wordsテーブルにuser_id制約を追加（すでにカラムがある場合）
-- CREATE INDEX IF NOT EXISTS idx_words_user_id ON words(user_id);

-- settingsテーブルにuser_id制約を追加
-- CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- game_scoresテーブルにuser_id制約を追加
-- CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);

-- aggregated_statsテーブルにuser_id制約を追加
-- CREATE INDEX IF NOT EXISTS idx_aggregated_stats_user_id ON aggregated_stats(user_id);

-- user_presetsテーブルにuser_id制約を追加
-- CREATE INDEX IF NOT EXISTS idx_user_presets_user_id ON user_presets(user_id);
```

### 4.2 マイグレーションの実行

```bash
bun run db:migrate
```

---

## ステップ5: Row-Level Security (RLS) の実装

### 5.1 SQLクエリレベルでのユーザーフィルタリング

現時点では、TursoはPostgreSQLのようなRLSをネイティブサポートしていません。
そのため、アプリケーションレベルでユーザーフィルタリングを実装します。

`src/server/db.ts`のクエリを更新：

```typescript
// 例: getAllWords関数をユーザーIDでフィルタリング
export async function getAllWords(db: Client, userId: string): Promise<WordRecord[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM words WHERE user_id = ?',
    args: [userId],
  })
  return result.rows as unknown as WordRecord[]
}

// 例: createWord関数にユーザーIDを追加
export async function createWord(
  db: Client,
  input: CreateWordInput,
  userId: string
): Promise<number> {
  const result = await db.execute({
    sql: `INSERT INTO words (text, reading, romaji, user_id, ...) VALUES (?, ?, ?, ?, ...)`,
    args: [input.text, input.reading, input.romaji, userId, ...],
  })
  return Number(result.lastInsertRowid)
}
```

### 5.2 エンドポイントでユーザーIDを渡す

```typescript
// src/server/index.ts

app.get('/api/words', requireAuth, async c => {
  try {
    if (!c.env.DB) {
      return c.json({ error: 'Database not configured' }, 500)
    }

    const auth = c.get('auth')
    const userId = auth?.user?.id

    if (!userId) {
      return c.json({ error: 'User ID not found' }, 401)
    }

    const words = await getAllWords(c.env.DB, userId)
    return c.json(words)
  } catch (error) {
    console.error('Failed to get words:', error)
    return c.json({ error: 'Failed to get words' }, 500)
  }
})
```

---

## トラブルシューティング

### エラー: "JWT verification failed"

**原因**: TursoがClerkのJWTを検証できない

**解決策**:

1. JWKS URLが正しく設定されているか確認
2. ClerkのJWTテンプレートが正しいか確認
3. トークンの有効期限が切れていないか確認

```bash
# JWKS URLの確認
curl https://clerk.type-flow.app/.well-known/jwks.json
```

### エラー: "401 Unauthorized" from Turso

**原因**: JWTが無効または設定が不完全

**解決策**:

1. Tursoグループの設定を確認
   ```bash
   turso group show <your-group-name>
   ```
2. JWTの内容をデバッグ（jwt.ioで確認）

### エラー: "Database not configured"

**原因**: データベース接続が確立されていない

**解決策**:

1. `TURSO_DATABASE_URL`が正しいか確認
2. トークンが正しく渡されているか確認

---

## 参考資料

- [Turso JWT Authentication](https://docs.turso.tech/features/data-edge/jwt)
- [Clerk JWT Templates](https://clerk.com/docs/backend-requests/jwt-templates)
- [Turso + Clerk Integration Example](https://github.com/turso-extended/app-turso-clerk)
- [TypeFlow認証ドキュメント](./CLERK_TURSO_SETUP.md)

---

## チェックリスト

### Turso側の設定

- [ ] TursoグループにJWKS URLを設定
- [ ] 設定が正しく反映されていることを確認

### Clerk側の設定

- [ ] JWTテンプレート「turso」を作成
- [ ] 必要なクレームを設定

### アプリケーションの変更

- [ ] フロントエンド: Turso用トークン取得関数を追加
- [ ] バックエンド: X-Turso-Tokenヘッダーからトークンを取得
- [ ] バックエンド: ユーザーIDによるデータフィルタリングを実装

### テスト

- [ ] ローカル環境でテスト
- [ ] 本番環境にデプロイ
- [ ] 異なるユーザーでデータが分離されていることを確認

---

## 実装の優先順位

1. **Phase 1**: Turso JWT認証の設定（ステップ1-2）
2. **Phase 2**: アプリケーションコードの変更（ステップ3）
3. **Phase 3**: データベーススキーマの更新（ステップ4）
4. **Phase 4**: ユーザーレベルのデータ分離（ステップ5）

**注意**: 各フェーズ完了後にテストを行い、問題がないことを確認してから次のフェーズに進んでください。
