import { Hono } from 'hono'
import type { Context } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@libsql/client'
import type { Env } from './types'
import {
  getAllWords,
  createWord,
  updateWord,
  deleteWord,
  deleteAllWords,
  bulkInsertWords,
  bulkInsertWordsWithStats,
  getAggregatedStats,
  upsertAggregatedStats,
  deleteAggregatedStats,
  getSettings,
  upsertSettings,
  getAllGameScores,
  createGameScore,
  deleteAllGameScores,
  getAllPresets,
  getPresetById,
  createPreset,
  updatePreset,
  deletePreset,
  deleteAllPresets,
  getAllUserPresets,
  getUserPresetById,
  createUserPreset,
  updateUserPreset,
  deleteUserPreset,
} from './db'
import type {
  CreateWordInput,
  UpdateWordInput,
  BulkInsertInput,
  BulkInsertWithStatsInput,
  UpdateAggregatedStatsInput,
  UpdateSettingsInput,
  CreateGameScoreInput,
  CreatePresetInput,
  UpdatePresetInput,
  CreateUserPresetInput,
  UpdateUserPresetInput,
} from './types'
import { authMiddleware, requireAuth, getUserId } from './auth'

// Honoのコンテキスト変数の型定義（auth.tsと一致させる）
type HonoVariables = {
  auth: {
    user: {
      id: string
      username: string | null
      email: string | null
      firstName: string | null
      lastName: string | null
    } | null
    isAuthenticated: boolean
  }
  tursoToken: string | null
}

type HonoEnv = {
  Bindings: Env
  Variables: HonoVariables
}

const app = new Hono<HonoEnv>()

// Honoインスタンスを名前付きエクスポート（Bunサーバー用）
export { app }

// 一括挿入の最大件数（DoS / DB肥大化対策）
const MAX_BULK_WORDS = 5000

// クライアントへ内部エラー詳細を漏らさず、サーバーログにのみ記録するヘルパー
function fail(c: Context<HonoEnv>, context: string, error: unknown) {
  console.error(`${context}:`, error)
  return c.json({ error: context }, 500)
}

// CORSミドルウェア
app.use('/*', async (c, next) => {
  const allowedOriginsStr = c.env.ALLOWED_ORIGINS || ''
  const allowedOrigins = allowedOriginsStr
    .split(',')
    .map(o => o.trim())
    .filter(o => o.length > 0)
  const isWildcard = allowedOrigins.length === 0 || allowedOrigins.includes('*')

  const corsOptions = {
    origin: (origin: string) => {
      if (isWildcard) {
        return '*'
      }
      return allowedOrigins.includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Turso-Token'],
    // ワイルドカード許可時に資格情報を伴うのは安全でないため、
    // 明示的な許可リストがある場合のみ credentials を有効化する。
    // （本APIは Bearer トークン認証なので cookie は使わない）
    credentials: !isWildcard,
  }

  return cors(corsOptions)(c, next)
})

// Health check endpoint (認証不要)
app.get('/health', async c => {
  try {
    // データベース接続の確認
    if (c.env.DB) {
      await c.env.DB.execute('SELECT 1')
    }
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Health check failed:', error)
    return c.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
      },
      500
    )
  }
})

// 認証ミドルウェアをすべてのリクエストに適用（/healthを除く）
app.use('/*', async (c, next) => {
  // /healthエンドポイントは認証不要
  if (c.req.path === '/health') {
    await next()
    return
  }
  return authMiddleware(c, next)
})

// データベースクライアントをリクエストごとに作成
// Clerk JWT（turso-jwtテンプレート）を使用してTursoに接続
// フォールバックとしてTURSO_AUTH_TOKENを使用
app.use('/*', async (c, next) => {
  const url = c.env.TURSO_DATABASE_URL

  if (!url) {
    await next()
    return
  }

  // ローカルデータベースの場合
  if (url.startsWith('file:')) {
    if (!c.env.DB) {
      const filePath = url.replace(/^file:/, '')
      c.env.DB = createClient({
        url: `file:${filePath}`,
      })
    }
    await next()
    return
  }

  // リモートTursoデータベースの場合
  // 常にTURSO_AUTH_TOKENを使用（Clerk JWT統合は後で有効化）
  // TODO: Clerk JWT統合が安定したら、X-Turso-Tokenを使用するように変更
  const fallbackToken = c.env.TURSO_AUTH_TOKEN
  if (fallbackToken) {
    c.env.DB = createClient({
      url,
      authToken: fallbackToken,
    })
  }

  await next()
})

// すべての /api/* ルートで認証を必須にする（IDOR / 無認証アクセス対策）
app.use('/api/*', requireAuth)

// Root endpoint - API情報を返す
app.get('/', async c => {
  return c.json({
    name: 'TypeFlow API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/me',
      words: '/api/words',
      stats: '/api/stats',
      scores: '/api/scores',
      settings: '/api/settings',
      presets: '/api/presets',
      userPresets: '/api/user-presets',
    },
  })
})

// Auth API - Clerkを使用するため、ユーザー情報のみ返す
app.get('/api/auth/me', async c => {
  const auth = c.get('auth')
  if (!auth || !auth.isAuthenticated || !auth.user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({
    user: auth.user,
  })
})

// Words API
app.get('/api/words', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const words = await getAllWords(c.env.DB, userId)
    return c.json(words)
  } catch (error) {
    return fail(c, 'Failed to get words', error)
  }
})

app.post('/api/words', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json<CreateWordInput>()
    if (!body?.text || !body?.romaji) {
      return c.json({ error: 'text and romaji are required' }, 400)
    }
    const id = await createWord(c.env.DB, body, userId)
    return c.json({ id })
  } catch (error) {
    return fail(c, 'Failed to create word', error)
  }
})

app.delete('/api/words', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    await deleteAllWords(c.env.DB, userId)
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to delete all words', error)
  }
})

// Bulk insert
app.post('/api/words/bulk', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json<BulkInsertInput>()
    if (!Array.isArray(body?.words)) {
      return c.json({ error: 'words must be an array' }, 400)
    }
    if (body.words.length > MAX_BULK_WORDS) {
      return c.json({ error: `Too many words (max ${MAX_BULK_WORDS})` }, 400)
    }
    if (body.words.some(w => !w?.text || !w?.romaji)) {
      return c.json({ error: 'Each word must have text and romaji' }, 400)
    }
    const insertedCount = await bulkInsertWords(
      c.env.DB,
      body.words,
      userId,
      body.clearExisting ?? false
    )
    return c.json({
      success: true,
      insertedCount,
      totalWords: body.words.length,
    })
  } catch (error) {
    return fail(c, 'Failed to bulk insert words', error)
  }
})

// Bulk insert with stats (for user presets)
app.post('/api/words/bulk-with-stats', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json<BulkInsertWithStatsInput>()
    if (!Array.isArray(body?.words)) {
      return c.json({ error: 'words must be an array' }, 400)
    }
    if (body.words.length > MAX_BULK_WORDS) {
      return c.json({ error: `Too many words (max ${MAX_BULK_WORDS})` }, 400)
    }
    if (body.words.some(w => !w?.text || !w?.romaji)) {
      return c.json({ error: 'Each word must have text and romaji' }, 400)
    }
    const insertedCount = await bulkInsertWordsWithStats(
      c.env.DB,
      body.words,
      userId,
      body.clearExisting ?? false
    )
    return c.json({
      success: true,
      insertedCount,
      totalWords: body.words.length,
    })
  } catch (error) {
    return fail(c, 'Failed to bulk insert words with stats', error)
  }
})

// Single word operations
app.delete('/api/words/:id', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400)
    }
    await deleteWord(c.env.DB, id, userId)
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to delete word', error)
  }
})

app.put('/api/words/:id', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400)
    }
    const body = await c.req.json<UpdateWordInput>()
    await updateWord(c.env.DB, id, body, userId)
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to update word', error)
  }
})

// Aggregated Stats API
app.get('/api/stats', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const stats = await getAggregatedStats(c.env.DB, userId)
    return c.json(stats)
  } catch (error) {
    return fail(c, 'Failed to get stats', error)
  }
})

app.put('/api/stats', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json<UpdateAggregatedStatsInput>()
    const existing = await getAggregatedStats(c.env.DB, userId)

    await upsertAggregatedStats(c.env.DB, userId, {
      keyStats: body.keyStats ?? existing?.keyStats ?? {},
      transitionStats: body.transitionStats ?? existing?.transitionStats ?? {},
      lastUpdated: body.lastUpdated ?? Date.now(),
    })
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to update stats', error)
  }
})

app.delete('/api/stats', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    await deleteAggregatedStats(c.env.DB, userId)
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to delete stats', error)
  }
})

// Game Scores API
app.get('/api/scores', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const scores = await getAllGameScores(c.env.DB, userId)
    return c.json(scores)
  } catch (error) {
    return fail(c, 'Failed to get scores', error)
  }
})

app.post('/api/scores', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json<CreateGameScoreInput>()
    const id = await createGameScore(c.env.DB, body, userId)
    return c.json({ id })
  } catch (error) {
    return fail(c, 'Failed to create score', error)
  }
})

app.delete('/api/scores', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    await deleteAllGameScores(c.env.DB, userId)
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to delete all scores', error)
  }
})

// Settings API
app.get('/api/settings', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const settings = await getSettings(c.env.DB, userId)
    return c.json(settings)
  } catch (error) {
    return fail(c, 'Failed to get settings', error)
  }
})

app.put('/api/settings', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json<UpdateSettingsInput>()
    await upsertSettings(c.env.DB, userId, body)
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to update settings', error)
  }
})

// Presets API（共有カタログ。閲覧・更新には認証が必要だが user_id では絞らない）
app.get('/api/presets', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const presets = await getAllPresets(c.env.DB)
    return c.json(presets)
  } catch (error) {
    return fail(c, 'Failed to get presets', error)
  }
})

app.get('/api/presets/:id', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const id = c.req.param('id')
    const preset = await getPresetById(c.env.DB, id)
    if (!preset) {
      return c.json({ error: 'Preset not found' }, 404)
    }
    return c.json(preset)
  } catch (error) {
    return fail(c, 'Failed to get preset', error)
  }
})

app.post('/api/presets', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const body = await c.req.json<CreatePresetInput>()
    await createPreset(c.env.DB, body)
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to create preset', error)
  }
})

app.put('/api/presets/:id', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const id = c.req.param('id')
    const body = await c.req.json<UpdatePresetInput>()
    await updatePreset(c.env.DB, id, body)
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to update preset', error)
  }
})

app.delete('/api/presets/:id', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const id = c.req.param('id')
    await deletePreset(c.env.DB, id)
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to delete preset', error)
  }
})

app.delete('/api/presets', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    await deleteAllPresets(c.env.DB)
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to delete all presets', error)
  }
})

// User Presets API
app.get('/api/user-presets', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const presets = await getAllUserPresets(c.env.DB, userId)
    return c.json(presets)
  } catch (error) {
    return fail(c, 'Failed to get user presets', error)
  }
})

app.get('/api/user-presets/:id', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const id = c.req.param('id')
    const preset = await getUserPresetById(c.env.DB, id, userId)
    if (!preset) {
      return c.json({ error: 'User preset not found' }, 404)
    }
    return c.json(preset)
  } catch (error) {
    return fail(c, 'Failed to get user preset', error)
  }
})

app.post('/api/user-presets', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const body = await c.req.json<CreateUserPresetInput>()
    await createUserPreset(c.env.DB, body, userId)
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to create user preset', error)
  }
})

app.put('/api/user-presets/:id', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const id = c.req.param('id')
    const body = await c.req.json<UpdateUserPresetInput>()
    await updateUserPreset(c.env.DB, id, body, userId)
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to update user preset', error)
  }
})

app.delete('/api/user-presets/:id', async c => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500)
    const userId = getUserId(c)
    if (!userId) return c.json({ error: 'Unauthorized' }, 401)
    const id = c.req.param('id')
    await deleteUserPreset(c.env.DB, id, userId)
    return c.json({ success: true })
  } catch (error) {
    return fail(c, 'Failed to delete user preset', error)
  }
})

// 404 Handler
app.notFound(c => {
  return c.json({ error: 'Not found' }, 404)
})

// Error Handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

// Cloudflare Workers用のエントリーポイント
// 環境変数からTursoクライアントを初期化してHonoアプリに注入
export default {
  async fetch(request: Request, env: Env, ctx: unknown): Promise<Response> {
    // Tursoクライアントを初期化（まだ初期化されていない場合）
    if (!env.DB) {
      const url = env.TURSO_DATABASE_URL
      const authToken = env.TURSO_AUTH_TOKEN

      if (!url) {
        return new Response(JSON.stringify({ error: 'TURSO_DATABASE_URL is not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // リモートデータベースの場合、認証トークンが必要
      if (!url.startsWith('file:') && !authToken) {
        return new Response(
          JSON.stringify({ error: 'TURSO_AUTH_TOKEN is required for remote database' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      env.DB = createClient({
        url,
        authToken: url.startsWith('file:') ? undefined : authToken,
      })
    }

    // Honoアプリに環境変数を注入してリクエストを処理
    return app.fetch(request, env, ctx as Parameters<typeof app.fetch>[2])
  },
}
