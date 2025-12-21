import { Hono } from 'hono'
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
import { authMiddleware, requireAuth } from './auth'

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

// CORSミドルウェア
app.use('/*', async (c, next) => {
  // const origin = c.req.header('Origin') // Not used in current implementation
  const allowedOriginsStr = c.env.ALLOWED_ORIGINS || '*'
  const allowedOrigins = allowedOriginsStr.split(',').map(o => o.trim())

  const corsOptions = {
    origin: (origin: string) => {
      if (allowedOrigins.includes('*')) {
        return '*'
      }
      return allowedOrigins.includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
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
    return c.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
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
  // X-Turso-TokenヘッダーからClerk JWTを取得（turso-jwtテンプレート使用）
  const tursoToken = c.req.header('X-Turso-Token')

  if (tursoToken) {
    // Clerk JWTを使用してTursoに接続（ユーザーレベルアクセス制御）
    c.env.DB = createClient({
      url,
      authToken: tursoToken,
    })
  } else {
    // フォールバック: TURSO_AUTH_TOKENを使用
    const fallbackToken = c.env.TURSO_AUTH_TOKEN
    if (fallbackToken && !c.env.DB) {
      c.env.DB = createClient({
        url,
        authToken: fallbackToken,
      })
    }
  }

  await next()
})

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
app.get('/api/auth/me', requireAuth, async c => {
  const auth = c.get('auth')
  if (!auth || !auth.isAuthenticated || !auth.user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({
    user: auth.user,
  })
})

// Words API - 認証が必要なエンドポイント
app.get('/api/words', requireAuth, async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const words = await getAllWords(c.env.DB)
    return c.json(words)
  } catch (error) {
    console.error('Failed to get words:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to get words' }, 500)
  }
})

app.post('/api/words', requireAuth, async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const body = await c.req.json<CreateWordInput>()
    const id = await createWord(c.env.DB, body)
    return c.json({ id })
  } catch (error) {
    console.error('Failed to create word:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to create word' }, 500)
  }
})

app.delete('/api/words', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    await deleteAllWords(c.env.DB)
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete all words:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to delete all words' },
      500
    )
  }
})

// Bulk insert
app.post('/api/words/bulk', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const body = await c.req.json<BulkInsertInput>()
    const insertedCount = await bulkInsertWords(c.env.DB, body.words, body.clearExisting ?? false)
    return c.json({
      success: true,
      insertedCount,
      totalWords: body.words.length,
    })
  } catch (error) {
    console.error('Failed to bulk insert words:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to bulk insert words' },
      500
    )
  }
})

// Bulk insert with stats (for user presets)
app.post('/api/words/bulk-with-stats', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const body = await c.req.json<BulkInsertWithStatsInput>()
    const insertedCount = await bulkInsertWordsWithStats(
      c.env.DB,
      body.words,
      body.clearExisting ?? false
    )
    return c.json({
      success: true,
      insertedCount,
      totalWords: body.words.length,
    })
  } catch (error) {
    console.error('Failed to bulk insert words with stats:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to bulk insert words with stats' },
      500
    )
  }
})

// Single word operations
app.delete('/api/words/:id', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400)
    }
    await deleteWord(c.env.DB, id)
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete word:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to delete word' }, 500)
  }
})

app.put('/api/words/:id', async c => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ error: 'Invalid ID' }, 400)
    }
    const body = await c.req.json<UpdateWordInput>()

    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }

    await updateWord(c.env.DB, id, body)
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to update word:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to update word' }, 500)
  }
})

// Aggregated Stats API
app.get('/api/stats', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const stats = await getAggregatedStats(c.env.DB)
    return c.json(stats)
  } catch (error) {
    console.error('Failed to get stats:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to get stats' }, 500)
  }
})

app.put('/api/stats', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const body = await c.req.json<UpdateAggregatedStatsInput>()
    const existing = await getAggregatedStats(c.env.DB)

    await upsertAggregatedStats(c.env.DB, {
      id: 1,
      keyStats: body.keyStats ?? existing?.keyStats ?? {},
      transitionStats: body.transitionStats ?? existing?.transitionStats ?? {},
      lastUpdated: body.lastUpdated ?? Date.now(),
    })
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to update stats:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to update stats' }, 500)
  }
})

app.delete('/api/stats', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    await deleteAggregatedStats(c.env.DB)
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete stats:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to delete stats' }, 500)
  }
})

// Game Scores API
app.get('/api/scores', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const scores = await getAllGameScores(c.env.DB)
    return c.json(scores)
  } catch (error) {
    console.error('Failed to get scores:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to get scores' }, 500)
  }
})

app.post('/api/scores', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const body = await c.req.json<CreateGameScoreInput>()
    const id = await createGameScore(c.env.DB, body)
    return c.json({ id })
  } catch (error) {
    console.error('Failed to create score:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to create score' }, 500)
  }
})

app.delete('/api/scores', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    await deleteAllGameScores(c.env.DB)
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete all scores:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to delete all scores' },
      500
    )
  }
})

// Settings API
app.get('/api/settings', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const settings = await getSettings(c.env.DB)
    return c.json(settings)
  } catch (error) {
    console.error('Failed to get settings:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to get settings' }, 500)
  }
})

app.put('/api/settings', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const body = await c.req.json<UpdateSettingsInput>()
    await upsertSettings(c.env.DB, body)
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      500
    )
  }
})

// Presets API
app.get('/api/presets', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const presets = await getAllPresets(c.env.DB)
    return c.json(presets)
  } catch (error) {
    console.error('Failed to get presets:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to get presets' }, 500)
  }
})

app.get('/api/presets/:id', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const id = c.req.param('id')
    const preset = await getPresetById(c.env.DB, id)
    if (!preset) {
      return c.json({ error: 'Preset not found' }, 404)
    }
    return c.json(preset)
  } catch (error) {
    console.error('Failed to get preset:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to get preset' }, 500)
  }
})

app.post('/api/presets', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const body = await c.req.json<CreatePresetInput>()
    await createPreset(c.env.DB, body)
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to create preset:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to create preset' },
      500
    )
  }
})

app.put('/api/presets/:id', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const id = c.req.param('id')
    const body = await c.req.json<UpdatePresetInput>()
    await updatePreset(c.env.DB, id, body)
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to update preset:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to update preset' },
      500
    )
  }
})

app.delete('/api/presets/:id', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const id = c.req.param('id')
    await deletePreset(c.env.DB, id)
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete preset:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to delete preset' },
      500
    )
  }
})

app.delete('/api/presets', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    await deleteAllPresets(c.env.DB)
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete all presets:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to delete all presets' },
      500
    )
  }
})

// User Presets API
app.get('/api/user-presets', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const presets = await getAllUserPresets(c.env.DB)
    return c.json(presets)
  } catch (error) {
    console.error('Failed to get user presets:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get user presets' },
      500
    )
  }
})

app.get('/api/user-presets/:id', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const id = c.req.param('id')
    const preset = await getUserPresetById(c.env.DB, id)
    if (!preset) {
      return c.json({ error: 'User preset not found' }, 404)
    }
    return c.json(preset)
  } catch (error) {
    console.error('Failed to get user preset:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get user preset' },
      500
    )
  }
})

app.post('/api/user-presets', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const body = await c.req.json<CreateUserPresetInput>()
    await createUserPreset(c.env.DB, body)
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to create user preset:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to create user preset' },
      500
    )
  }
})

app.put('/api/user-presets/:id', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const id = c.req.param('id')
    const body = await c.req.json<UpdateUserPresetInput>()
    await updateUserPreset(c.env.DB, id, body)
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to update user preset:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to update user preset' },
      500
    )
  }
})

app.delete('/api/user-presets/:id', async c => {
  try {
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured' }, 500)
    }
    const id = c.req.param('id')
    await deleteUserPreset(c.env.DB, id)
    return c.json({ success: true })
  } catch (error) {
    console.error('Failed to delete user preset:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user preset' },
      500
    )
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
