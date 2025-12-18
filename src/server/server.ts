/// <reference types="bun-types" />
import { Hono } from 'hono'
import { createClient } from '@libsql/client'
import { app } from './index'
import type { Env } from './types'

// Tursoクライアントの初期化
function createTursoClient(): ReturnType<typeof createClient> {
  let url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  // 環境変数が設定されていない場合、ローカルDBをデフォルトで使用
  if (!url) {
    const localPath = process.env.TURSO_LOCAL_DB_PATH || './local.db'
    url = `file:${localPath}`
    console.log(`ℹ️  TURSO_DATABASE_URL not set, using local database: ${url}`)
  }

  // ローカル開発時はauthTokenが不要（ローカルファイルを使用する場合）
  if (url.startsWith('file:')) {
    // file: スキームから実際のパスを取得
    const filePath = url.replace(/^file:/, '')
    return createClient({
      url: `file:${filePath}`,
    })
  }

  // リモートデータベースの場合、認証トークンが必要
  if (!authToken) {
    throw new Error('TURSO_AUTH_TOKEN environment variable is required for remote database')
  }

  return createClient({
    url,
    authToken,
  })
}

// 環境変数からTursoクライアントを作成
let db: ReturnType<typeof createClient>

try {
  db = createTursoClient()
} catch (error) {
  console.error('❌ Failed to create database client:', error)
  process.exit(1)
}

// Honoアプリにデータベースを注入するためのアダプター
const serverApp = new Hono<{ Bindings: Env }>()

// すべてのリクエストにデータベースを注入
serverApp.use('/*', async (c, next) => {
  // 環境変数を設定（Honoのコンテキストに注入）
  c.env = {
    DB: db,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  } as Env

  await next()
})

// 元のアプリのルートをマウント
serverApp.route('/', app)

const port = parseInt(process.env.PORT || '3456', 10)

// データベース接続の検証
async function verifyDatabaseConnection() {
  try {
    await db.execute('SELECT 1')
    console.log('✅ Database connection verified')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

// サーバー起動
async function startServer() {
  try {
    await verifyDatabaseConnection()

    console.log(`🚀 TypeFlow API Server starting on port ${port}`)
    console.log(
      `📊 Database: ${process.env.TURSO_DATABASE_URL?.startsWith('file:') ? 'Local SQLite' : 'Turso'}`
    )

    const server = Bun.serve({
      fetch: serverApp.fetch,
      port,
    })

    console.log(`✅ Server running at http://localhost:${port}`)

    // グレースフルシャットダウン
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...')
      server.stop()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down server...')
      server.stop()
      process.exit(0)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
