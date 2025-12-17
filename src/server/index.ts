import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types'
import {
  getAllWords,
  createWord,
  updateWord,
  deleteWord,
  deleteAllWords,
  bulkInsertWords,
  getAggregatedStats,
  upsertAggregatedStats,
  deleteAggregatedStats,
  getSettings,
  upsertSettings,
  getAllGameScores,
  createGameScore,
  deleteAllGameScores,
} from './db'
import type {
  CreateWordInput,
  UpdateWordInput,
  BulkInsertInput,
  UpdateAggregatedStatsInput,
  UpdateSettingsInput,
  CreateGameScoreInput,
} from './types'

type HonoEnv = {
  Bindings: Env
}

const app = new Hono<HonoEnv>()

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
    allowHeaders: ['Content-Type'],
  }

  return cors(corsOptions)(c, next)
})

// Words API
app.get('/api/words', async c => {
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

app.post('/api/words', async c => {
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

// 404 Handler
app.notFound(c => {
  return c.json({ error: 'Not found' }, 404)
})

// Error Handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
