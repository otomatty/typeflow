import { Database } from 'bun:sqlite'
import { resolve } from 'path'

// データベースファイルのパス（プロジェクトルートに保存）
const DB_PATH = resolve(import.meta.dir, '../data/typeflow.db')

// データベース接続
const db = new Database(DB_PATH, { create: true })

// テーブル初期化
db.run(`
  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    reading TEXT NOT NULL,
    romaji TEXT NOT NULL,
    correct INTEGER DEFAULT 0,
    miss INTEGER DEFAULT 0,
    last_played INTEGER DEFAULT 0,
    accuracy REAL DEFAULT 100,
    created_at INTEGER NOT NULL,
    mastery_level INTEGER DEFAULT 0,
    next_review_at INTEGER DEFAULT 0,
    consecutive_correct INTEGER DEFAULT 0
  )
`)

// 既存テーブルへのカラム追加（マイグレーション）
try {
  db.run('ALTER TABLE words ADD COLUMN mastery_level INTEGER DEFAULT 0')
} catch {}
try {
  db.run('ALTER TABLE words ADD COLUMN next_review_at INTEGER DEFAULT 0')
} catch {}
try {
  db.run('ALTER TABLE words ADD COLUMN consecutive_correct INTEGER DEFAULT 0')
} catch {}

db.run(`
  CREATE TABLE IF NOT EXISTS aggregated_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    key_stats TEXT NOT NULL DEFAULT '{}',
    transition_stats TEXT NOT NULL DEFAULT '{}',
    last_updated INTEGER NOT NULL
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    word_count TEXT NOT NULL DEFAULT 'all',
    theme TEXT NOT NULL DEFAULT 'dark',
    practice_mode TEXT NOT NULL DEFAULT 'balanced',
    srs_enabled INTEGER NOT NULL DEFAULT 1,
    warmup_enabled INTEGER NOT NULL DEFAULT 1,
    difficulty_preset TEXT NOT NULL DEFAULT 'normal',
    time_limit_mode TEXT NOT NULL DEFAULT 'adaptive',
    fixed_time_limit REAL NOT NULL DEFAULT 10,
    comfort_zone_ratio REAL NOT NULL DEFAULT 0.85,
    min_time_limit REAL NOT NULL DEFAULT 1.5,
    max_time_limit REAL NOT NULL DEFAULT 15,
    miss_penalty_enabled INTEGER NOT NULL DEFAULT 1,
    base_penalty_percent REAL NOT NULL DEFAULT 5,
    penalty_escalation_factor REAL NOT NULL DEFAULT 1.5,
    max_penalty_percent REAL NOT NULL DEFAULT 30,
    min_time_after_penalty REAL NOT NULL DEFAULT 0.5,
    updated_at INTEGER NOT NULL
  )
`)

// 既存テーブルへのカラム追加（マイグレーション）
try {
  db.run("ALTER TABLE settings ADD COLUMN practice_mode TEXT NOT NULL DEFAULT 'balanced'")
} catch {}
try {
  db.run('ALTER TABLE settings ADD COLUMN srs_enabled INTEGER NOT NULL DEFAULT 1')
} catch {}
try {
  db.run('ALTER TABLE settings ADD COLUMN warmup_enabled INTEGER NOT NULL DEFAULT 1')
} catch {}
// 難易度プリセット
try {
  db.run("ALTER TABLE settings ADD COLUMN difficulty_preset TEXT NOT NULL DEFAULT 'normal'")
} catch {}
// 動的制限時間設定
try {
  db.run("ALTER TABLE settings ADD COLUMN time_limit_mode TEXT NOT NULL DEFAULT 'adaptive'")
} catch {}
try {
  db.run('ALTER TABLE settings ADD COLUMN fixed_time_limit REAL NOT NULL DEFAULT 10')
} catch {}
try {
  db.run('ALTER TABLE settings ADD COLUMN comfort_zone_ratio REAL NOT NULL DEFAULT 0.85')
} catch {}
try {
  db.run('ALTER TABLE settings ADD COLUMN min_time_limit REAL NOT NULL DEFAULT 1.5')
} catch {}
try {
  db.run('ALTER TABLE settings ADD COLUMN max_time_limit REAL NOT NULL DEFAULT 15')
} catch {}
// ミスペナルティ設定
try {
  db.run('ALTER TABLE settings ADD COLUMN miss_penalty_enabled INTEGER NOT NULL DEFAULT 1')
} catch {}
try {
  db.run('ALTER TABLE settings ADD COLUMN base_penalty_percent REAL NOT NULL DEFAULT 5')
} catch {}
try {
  db.run('ALTER TABLE settings ADD COLUMN penalty_escalation_factor REAL NOT NULL DEFAULT 1.5')
} catch {}
try {
  db.run('ALTER TABLE settings ADD COLUMN max_penalty_percent REAL NOT NULL DEFAULT 30')
} catch {}
try {
  db.run('ALTER TABLE settings ADD COLUMN min_time_after_penalty REAL NOT NULL DEFAULT 0.5')
} catch {}

db.run(`
  CREATE TABLE IF NOT EXISTS game_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kps REAL NOT NULL,
    total_keystrokes INTEGER NOT NULL,
    accuracy REAL NOT NULL,
    correct_words INTEGER NOT NULL,
    perfect_words INTEGER NOT NULL,
    total_words INTEGER NOT NULL,
    total_time REAL NOT NULL,
    played_at INTEGER NOT NULL
  )
`)

// CORS ヘッダー
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// JSON レスポンスヘルパー
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

// サーバー起動
const server = Bun.serve({
  port: 3456,
  async fetch(req) {
    const url = new URL(req.url)
    const method = req.method

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      // Words API
      if (url.pathname === '/api/words') {
        if (method === 'GET') {
          const words = db.query('SELECT * FROM words ORDER BY created_at DESC').all()
          return jsonResponse(words.map(wordToRecord))
        }

        if (method === 'POST') {
          const body = await req.json()
          const stmt = db.prepare(`
            INSERT INTO words (text, reading, romaji, correct, miss, last_played, accuracy, created_at, mastery_level, next_review_at, consecutive_correct)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          const result = stmt.run(
            body.text,
            body.reading,
            body.romaji,
            body.correct ?? 0,
            body.miss ?? 0,
            body.lastPlayed ?? 0,
            body.accuracy ?? 100,
            body.createdAt ?? Date.now(),
            body.masteryLevel ?? 0,
            body.nextReviewAt ?? 0,
            body.consecutiveCorrect ?? 0
          )
          return jsonResponse({ id: result.lastInsertRowid })
        }

        if (method === 'DELETE') {
          // 全単語を削除
          db.run('DELETE FROM words')
          return jsonResponse({ success: true })
        }
      }

      // Bulk insert API for presets
      if (url.pathname === '/api/words/bulk') {
        if (method === 'POST') {
          const body = await req.json() as {
            words: Array<{ text: string; reading: string; romaji: string }>
            clearExisting?: boolean
          }

          // 既存データをクリアするオプション
          if (body.clearExisting) {
            db.run('DELETE FROM words')
          }

          const stmt = db.prepare(`
            INSERT INTO words (text, reading, romaji, correct, miss, last_played, accuracy, created_at, mastery_level, next_review_at, consecutive_correct)
            VALUES (?, ?, ?, 0, 0, 0, 100, ?, 0, 0, 0)
          `)
          const now = Date.now()
          let insertedCount = 0

          for (const word of body.words) {
            try {
              stmt.run(word.text, word.reading, word.romaji, now)
              insertedCount++
            } catch (e) {
              console.error(`Failed to insert word: ${word.text}`, e)
            }
          }

          return jsonResponse({ 
            success: true, 
            insertedCount,
            totalWords: body.words.length 
          })
        }
      }

      // Single word operations
      const wordMatch = url.pathname.match(/^\/api\/words\/(\d+)$/)
      if (wordMatch) {
        const id = parseInt(wordMatch[1])

        if (method === 'DELETE') {
          db.run('DELETE FROM words WHERE id = ?', [id])
          return jsonResponse({ success: true })
        }

        if (method === 'PUT') {
          const body = await req.json()
          const updates: string[] = []
          const values: unknown[] = []

          if (body.correct !== undefined) {
            updates.push('correct = ?')
            values.push(body.correct)
          }
          if (body.miss !== undefined) {
            updates.push('miss = ?')
            values.push(body.miss)
          }
          if (body.lastPlayed !== undefined) {
            updates.push('last_played = ?')
            values.push(body.lastPlayed)
          }
          if (body.accuracy !== undefined) {
            updates.push('accuracy = ?')
            values.push(body.accuracy)
          }
          if (body.masteryLevel !== undefined) {
            updates.push('mastery_level = ?')
            values.push(body.masteryLevel)
          }
          if (body.nextReviewAt !== undefined) {
            updates.push('next_review_at = ?')
            values.push(body.nextReviewAt)
          }
          if (body.consecutiveCorrect !== undefined) {
            updates.push('consecutive_correct = ?')
            values.push(body.consecutiveCorrect)
          }

          if (updates.length > 0) {
            values.push(id)
            db.run(`UPDATE words SET ${updates.join(', ')} WHERE id = ?`, values)
          }
          return jsonResponse({ success: true })
        }
      }

      // Aggregated Stats API
      if (url.pathname === '/api/stats') {
        if (method === 'GET') {
          const stats = db.query('SELECT * FROM aggregated_stats WHERE id = 1').get() as {
            id: number
            key_stats: string
            transition_stats: string
            last_updated: number
          } | null
          
          if (!stats) {
            return jsonResponse(null)
          }
          
          return jsonResponse({
            id: stats.id,
            keyStats: JSON.parse(stats.key_stats),
            transitionStats: JSON.parse(stats.transition_stats),
            lastUpdated: stats.last_updated,
          })
        }

        if (method === 'PUT') {
          const body = await req.json()
          db.run(
            `INSERT OR REPLACE INTO aggregated_stats (id, key_stats, transition_stats, last_updated)
             VALUES (1, ?, ?, ?)`,
            [
              JSON.stringify(body.keyStats ?? {}),
              JSON.stringify(body.transitionStats ?? {}),
              body.lastUpdated ?? Date.now(),
            ]
          )
          return jsonResponse({ success: true })
        }

        if (method === 'DELETE') {
          db.run('DELETE FROM aggregated_stats WHERE id = 1')
          return jsonResponse({ success: true })
        }
      }

      // Game Scores API
      if (url.pathname === '/api/scores') {
        if (method === 'GET') {
          const scores = db.query('SELECT * FROM game_scores ORDER BY played_at DESC').all() as Array<{
            id: number
            kps: number
            total_keystrokes: number
            accuracy: number
            correct_words: number
            perfect_words: number
            total_words: number
            total_time: number
            played_at: number
          }>
          
          return jsonResponse(scores.map(score => ({
            id: score.id,
            kps: score.kps,
            totalKeystrokes: score.total_keystrokes,
            accuracy: score.accuracy,
            correctWords: score.correct_words,
            perfectWords: score.perfect_words,
            totalWords: score.total_words,
            totalTime: score.total_time,
            playedAt: score.played_at,
          })))
        }

        if (method === 'POST') {
          const body = await req.json() as {
            kps: number
            totalKeystrokes: number
            accuracy: number
            correctWords: number
            perfectWords: number
            totalWords: number
            totalTime: number
          }
          
          const stmt = db.prepare(`
            INSERT INTO game_scores (kps, total_keystrokes, accuracy, correct_words, perfect_words, total_words, total_time, played_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)
          const result = stmt.run(
            body.kps,
            body.totalKeystrokes,
            body.accuracy,
            body.correctWords,
            body.perfectWords,
            body.totalWords,
            body.totalTime,
            Date.now()
          )
          return jsonResponse({ id: result.lastInsertRowid })
        }

        if (method === 'DELETE') {
          db.run('DELETE FROM game_scores')
          return jsonResponse({ success: true })
        }
      }

      // Settings API
      if (url.pathname === '/api/settings') {
        if (method === 'GET') {
          const settings = db.query('SELECT * FROM settings WHERE id = 1').get() as {
            id: number
            word_count: string
            theme: string
            practice_mode: string
            srs_enabled: number
            warmup_enabled: number
            difficulty_preset: string
            time_limit_mode: string
            fixed_time_limit: number
            comfort_zone_ratio: number
            min_time_limit: number
            max_time_limit: number
            miss_penalty_enabled: number
            base_penalty_percent: number
            penalty_escalation_factor: number
            max_penalty_percent: number
            min_time_after_penalty: number
            updated_at: number
          } | null
          
          if (!settings) {
            return jsonResponse(null)
          }
          
          return jsonResponse({
            id: settings.id,
            wordCount: settings.word_count,
            theme: settings.theme,
            practiceMode: settings.practice_mode,
            srsEnabled: Boolean(settings.srs_enabled),
            warmupEnabled: Boolean(settings.warmup_enabled),
            difficultyPreset: settings.difficulty_preset ?? 'normal',
            timeLimitMode: settings.time_limit_mode ?? 'adaptive',
            fixedTimeLimit: settings.fixed_time_limit ?? 10,
            comfortZoneRatio: settings.comfort_zone_ratio ?? 0.85,
            minTimeLimit: settings.min_time_limit ?? 1.5,
            maxTimeLimit: settings.max_time_limit ?? 15,
            missPenaltyEnabled: Boolean(settings.miss_penalty_enabled ?? 1),
            basePenaltyPercent: settings.base_penalty_percent ?? 5,
            penaltyEscalationFactor: settings.penalty_escalation_factor ?? 1.5,
            maxPenaltyPercent: settings.max_penalty_percent ?? 30,
            minTimeAfterPenalty: settings.min_time_after_penalty ?? 0.5,
            updatedAt: settings.updated_at,
          })
        }

        if (method === 'PUT') {
          const body = await req.json()
          const existing = db.query('SELECT * FROM settings WHERE id = 1').get()
          
          if (existing) {
            const updates: string[] = []
            const values: unknown[] = []

            if (body.wordCount !== undefined) {
              updates.push('word_count = ?')
              values.push(body.wordCount)
            }
            if (body.theme !== undefined) {
              updates.push('theme = ?')
              values.push(body.theme)
            }
            if (body.practiceMode !== undefined) {
              updates.push('practice_mode = ?')
              values.push(body.practiceMode)
            }
            if (body.srsEnabled !== undefined) {
              updates.push('srs_enabled = ?')
              values.push(body.srsEnabled ? 1 : 0)
            }
            if (body.warmupEnabled !== undefined) {
              updates.push('warmup_enabled = ?')
              values.push(body.warmupEnabled ? 1 : 0)
            }
            // 難易度プリセット
            if (body.difficultyPreset !== undefined) {
              updates.push('difficulty_preset = ?')
              values.push(body.difficultyPreset)
            }
            // 動的制限時間設定
            if (body.timeLimitMode !== undefined) {
              updates.push('time_limit_mode = ?')
              values.push(body.timeLimitMode)
            }
            if (body.fixedTimeLimit !== undefined) {
              updates.push('fixed_time_limit = ?')
              values.push(body.fixedTimeLimit)
            }
            if (body.comfortZoneRatio !== undefined) {
              updates.push('comfort_zone_ratio = ?')
              values.push(body.comfortZoneRatio)
            }
            if (body.minTimeLimit !== undefined) {
              updates.push('min_time_limit = ?')
              values.push(body.minTimeLimit)
            }
            if (body.maxTimeLimit !== undefined) {
              updates.push('max_time_limit = ?')
              values.push(body.maxTimeLimit)
            }
            // ミスペナルティ設定
            if (body.missPenaltyEnabled !== undefined) {
              updates.push('miss_penalty_enabled = ?')
              values.push(body.missPenaltyEnabled ? 1 : 0)
            }
            if (body.basePenaltyPercent !== undefined) {
              updates.push('base_penalty_percent = ?')
              values.push(body.basePenaltyPercent)
            }
            if (body.penaltyEscalationFactor !== undefined) {
              updates.push('penalty_escalation_factor = ?')
              values.push(body.penaltyEscalationFactor)
            }
            if (body.maxPenaltyPercent !== undefined) {
              updates.push('max_penalty_percent = ?')
              values.push(body.maxPenaltyPercent)
            }
            if (body.minTimeAfterPenalty !== undefined) {
              updates.push('min_time_after_penalty = ?')
              values.push(body.minTimeAfterPenalty)
            }
            updates.push('updated_at = ?')
            values.push(Date.now())

            db.run(`UPDATE settings SET ${updates.join(', ')} WHERE id = 1`, values)
          } else {
            db.run(
              `INSERT INTO settings (id, word_count, theme, practice_mode, srs_enabled, warmup_enabled, difficulty_preset, time_limit_mode, fixed_time_limit, comfort_zone_ratio, min_time_limit, max_time_limit, miss_penalty_enabled, base_penalty_percent, penalty_escalation_factor, max_penalty_percent, min_time_after_penalty, updated_at)
               VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                body.wordCount ?? 'all',
                body.theme ?? 'dark',
                body.practiceMode ?? 'balanced',
                body.srsEnabled !== undefined ? (body.srsEnabled ? 1 : 0) : 1,
                body.warmupEnabled !== undefined ? (body.warmupEnabled ? 1 : 0) : 1,
                body.difficultyPreset ?? 'normal',
                body.timeLimitMode ?? 'adaptive',
                body.fixedTimeLimit ?? 10,
                body.comfortZoneRatio ?? 0.85,
                body.minTimeLimit ?? 1.5,
                body.maxTimeLimit ?? 15,
                body.missPenaltyEnabled !== undefined ? (body.missPenaltyEnabled ? 1 : 0) : 1,
                body.basePenaltyPercent ?? 5,
                body.penaltyEscalationFactor ?? 1.5,
                body.maxPenaltyPercent ?? 30,
                body.minTimeAfterPenalty ?? 0.5,
                Date.now()
              ]
            )
          }
          return jsonResponse({ success: true })
        }
      }

      return jsonResponse({ error: 'Not found' }, 404)
    } catch (error) {
      console.error('API Error:', error)
      return jsonResponse({ error: String(error) }, 500)
    }
  },
})

// snake_case → camelCase 変換
function wordToRecord(row: Record<string, unknown>) {
  return {
    id: row.id,
    text: row.text,
    reading: row.reading,
    romaji: row.romaji,
    correct: row.correct,
    miss: row.miss,
    lastPlayed: row.last_played,
    accuracy: row.accuracy,
    createdAt: row.created_at,
    masteryLevel: row.mastery_level ?? 0,
    nextReviewAt: row.next_review_at ?? 0,
    consecutiveCorrect: row.consecutive_correct ?? 0,
  }
}

console.log(`🚀 TypeFlow API Server running at http://localhost:${server.port}`)
