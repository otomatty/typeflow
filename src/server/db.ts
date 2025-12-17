import type { D1Database } from '@cloudflare/workers-types'
import type {
  WordRow,
  WordRecord,
  CreateWordInput,
  UpdateWordInput,
  AggregatedStatsRow,
  AggregatedStatsRecord,
  SettingsRow,
  SettingsRecord,
  UpdateSettingsInput,
  GameScoreRow,
  GameScoreRecord,
  CreateGameScoreInput,
  BulkInsertWord,
} from './types'

// snake_case → camelCase 変換
export function wordRowToRecord(row: WordRow): WordRecord {
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
    masteryLevel: row.mastery_level,
    nextReviewAt: row.next_review_at,
    consecutiveCorrect: row.consecutive_correct,
  }
}

// Words操作
export async function getAllWords(db: D1Database): Promise<WordRecord[]> {
  const result = await db.prepare('SELECT * FROM words ORDER BY created_at DESC').all<WordRow>()
  return result.results.map(wordRowToRecord)
}

export async function getWordById(db: D1Database, id: number): Promise<WordRecord | null> {
  const result = await db.prepare('SELECT * FROM words WHERE id = ?').bind(id).first<WordRow>()
  return result ? wordRowToRecord(result) : null
}

export async function createWord(db: D1Database, input: CreateWordInput): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO words (text, reading, romaji, correct, miss, last_played, accuracy, created_at, mastery_level, next_review_at, consecutive_correct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.text,
      input.reading,
      input.romaji,
      input.correct ?? 0,
      input.miss ?? 0,
      input.lastPlayed ?? 0,
      input.accuracy ?? 100,
      input.createdAt ?? Date.now(),
      input.masteryLevel ?? 0,
      input.nextReviewAt ?? 0,
      input.consecutiveCorrect ?? 0
    )
    .run()

  return result.meta.last_row_id ?? 0
}

export async function updateWord(
  db: D1Database,
  id: number,
  input: UpdateWordInput
): Promise<void> {
  const updates: string[] = []
  const values: unknown[] = []

  if (input.correct !== undefined) {
    updates.push('correct = ?')
    values.push(input.correct)
  }
  if (input.miss !== undefined) {
    updates.push('miss = ?')
    values.push(input.miss)
  }
  if (input.lastPlayed !== undefined) {
    updates.push('last_played = ?')
    values.push(input.lastPlayed)
  }
  if (input.accuracy !== undefined) {
    updates.push('accuracy = ?')
    values.push(input.accuracy)
  }
  if (input.masteryLevel !== undefined) {
    updates.push('mastery_level = ?')
    values.push(input.masteryLevel)
  }
  if (input.nextReviewAt !== undefined) {
    updates.push('next_review_at = ?')
    values.push(input.nextReviewAt)
  }
  if (input.consecutiveCorrect !== undefined) {
    updates.push('consecutive_correct = ?')
    values.push(input.consecutiveCorrect)
  }

  if (updates.length > 0) {
    values.push(id)
    await db
      .prepare(`UPDATE words SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run()
  }
}

export async function deleteWord(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM words WHERE id = ?').bind(id).run()
}

export async function deleteAllWords(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM words').run()
}

export async function bulkInsertWords(
  db: D1Database,
  words: BulkInsertWord[],
  clearExisting: boolean = false
): Promise<number> {
  if (clearExisting) {
    await deleteAllWords(db)
  }

  const stmt = db.prepare(
    `INSERT INTO words (text, reading, romaji, correct, miss, last_played, accuracy, created_at, mastery_level, next_review_at, consecutive_correct)
     VALUES (?, ?, ?, 0, 0, 0, 100, ?, 0, 0, 0)`
  )

  const now = Date.now()
  let insertedCount = 0

  // バッチ処理で挿入
  const batch = words.map(word => stmt.bind(word.text, word.reading, word.romaji, now))
  const results = await db.batch(batch)

  for (const result of results) {
    if (result.success) {
      insertedCount++
    }
  }

  return insertedCount
}

// Aggregated Stats操作
export async function getAggregatedStats(db: D1Database): Promise<AggregatedStatsRecord | null> {
  const result = await db
    .prepare('SELECT * FROM aggregated_stats WHERE id = 1')
    .first<AggregatedStatsRow>()

  if (!result) {
    return null
  }

  return {
    id: result.id,
    keyStats: JSON.parse(result.key_stats),
    transitionStats: JSON.parse(result.transition_stats),
    lastUpdated: result.last_updated,
  }
}

export async function upsertAggregatedStats(
  db: D1Database,
  input: AggregatedStatsRecord
): Promise<void> {
  await db
    .prepare(
      `INSERT OR REPLACE INTO aggregated_stats (id, key_stats, transition_stats, last_updated)
       VALUES (1, ?, ?, ?)`
    )
    .bind(
      JSON.stringify(input.keyStats ?? {}),
      JSON.stringify(input.transitionStats ?? {}),
      input.lastUpdated ?? Date.now()
    )
    .run()
}

export async function deleteAggregatedStats(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM aggregated_stats WHERE id = 1').run()
}

// Settings操作
export async function getSettings(db: D1Database): Promise<SettingsRecord | null> {
  const result = await db.prepare('SELECT * FROM settings WHERE id = 1').first<SettingsRow>()

  if (!result) {
    return null
  }

  return {
    id: result.id,
    wordCount: result.word_count as any,
    theme: result.theme as any,
    practiceMode: result.practice_mode as any,
    srsEnabled: Boolean(result.srs_enabled),
    warmupEnabled: Boolean(result.warmup_enabled),
    difficultyPreset: result.difficulty_preset as any,
    timeLimitMode: result.time_limit_mode,
    fixedTimeLimit: result.fixed_time_limit,
    comfortZoneRatio: result.comfort_zone_ratio,
    minTimeLimit: result.min_time_limit,
    maxTimeLimit: result.max_time_limit,
    minTimeLimitByDifficulty: result.min_time_limit_by_difficulty ?? 1.5,
    missPenaltyEnabled: Boolean(result.miss_penalty_enabled),
    basePenaltyPercent: result.base_penalty_percent,
    penaltyEscalationFactor: result.penalty_escalation_factor,
    maxPenaltyPercent: result.max_penalty_percent,
    minTimeAfterPenalty: result.min_time_after_penalty,
    updatedAt: result.updated_at,
  }
}

export async function upsertSettings(db: D1Database, input: UpdateSettingsInput): Promise<void> {
  const existing = await getSettings(db)

  if (existing) {
    const updates: string[] = []
    const values: unknown[] = []

    if (input.wordCount !== undefined) {
      updates.push('word_count = ?')
      values.push(input.wordCount)
    }
    if (input.theme !== undefined) {
      updates.push('theme = ?')
      values.push(input.theme)
    }
    if (input.practiceMode !== undefined) {
      updates.push('practice_mode = ?')
      values.push(input.practiceMode)
    }
    if (input.srsEnabled !== undefined) {
      updates.push('srs_enabled = ?')
      values.push(input.srsEnabled ? 1 : 0)
    }
    if (input.warmupEnabled !== undefined) {
      updates.push('warmup_enabled = ?')
      values.push(input.warmupEnabled ? 1 : 0)
    }
    if (input.difficultyPreset !== undefined) {
      updates.push('difficulty_preset = ?')
      values.push(input.difficultyPreset)
    }
    if (input.timeLimitMode !== undefined) {
      updates.push('time_limit_mode = ?')
      values.push(input.timeLimitMode)
    }
    if (input.fixedTimeLimit !== undefined) {
      updates.push('fixed_time_limit = ?')
      values.push(input.fixedTimeLimit)
    }
    if (input.comfortZoneRatio !== undefined) {
      updates.push('comfort_zone_ratio = ?')
      values.push(input.comfortZoneRatio)
    }
    if (input.minTimeLimit !== undefined) {
      updates.push('min_time_limit = ?')
      values.push(input.minTimeLimit)
    }
    if (input.maxTimeLimit !== undefined) {
      updates.push('max_time_limit = ?')
      values.push(input.maxTimeLimit)
    }
    if (input.minTimeLimitByDifficulty !== undefined) {
      updates.push('min_time_limit_by_difficulty = ?')
      values.push(input.minTimeLimitByDifficulty)
    }
    if (input.missPenaltyEnabled !== undefined) {
      updates.push('miss_penalty_enabled = ?')
      values.push(input.missPenaltyEnabled ? 1 : 0)
    }
    if (input.basePenaltyPercent !== undefined) {
      updates.push('base_penalty_percent = ?')
      values.push(input.basePenaltyPercent)
    }
    if (input.penaltyEscalationFactor !== undefined) {
      updates.push('penalty_escalation_factor = ?')
      values.push(input.penaltyEscalationFactor)
    }
    if (input.maxPenaltyPercent !== undefined) {
      updates.push('max_penalty_percent = ?')
      values.push(input.maxPenaltyPercent)
    }
    if (input.minTimeAfterPenalty !== undefined) {
      updates.push('min_time_after_penalty = ?')
      values.push(input.minTimeAfterPenalty)
    }
    updates.push('updated_at = ?')
    values.push(Date.now())

    if (updates.length > 0) {
      await db
        .prepare(`UPDATE settings SET ${updates.join(', ')} WHERE id = 1`)
        .bind(...values)
        .run()
    }
  } else {
    await db
      .prepare(
        `INSERT INTO settings (id, word_count, theme, practice_mode, srs_enabled, warmup_enabled, difficulty_preset, time_limit_mode, fixed_time_limit, comfort_zone_ratio, min_time_limit, max_time_limit, min_time_limit_by_difficulty, miss_penalty_enabled, base_penalty_percent, penalty_escalation_factor, max_penalty_percent, min_time_after_penalty, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        input.wordCount ?? 'all',
        input.theme ?? 'dark',
        input.practiceMode ?? 'balanced',
        input.srsEnabled !== undefined ? (input.srsEnabled ? 1 : 0) : 1,
        input.warmupEnabled !== undefined ? (input.warmupEnabled ? 1 : 0) : 1,
        input.difficultyPreset ?? 'normal',
        input.timeLimitMode ?? 'adaptive',
        input.fixedTimeLimit ?? 10,
        input.comfortZoneRatio ?? 0.85,
        input.minTimeLimit ?? 1.5,
        input.maxTimeLimit ?? 15,
        input.minTimeLimitByDifficulty ?? 1.5,
        input.missPenaltyEnabled !== undefined ? (input.missPenaltyEnabled ? 1 : 0) : 1,
        input.basePenaltyPercent ?? 5,
        input.penaltyEscalationFactor ?? 1.5,
        input.maxPenaltyPercent ?? 30,
        input.minTimeAfterPenalty ?? 0.5,
        Date.now()
      )
      .run()
  }
}

// Game Scores操作
export async function getAllGameScores(db: D1Database): Promise<GameScoreRecord[]> {
  const result = await db
    .prepare('SELECT * FROM game_scores ORDER BY played_at DESC')
    .all<GameScoreRow>()

  return result.results.map(row => ({
    id: row.id,
    kps: row.kps,
    totalKeystrokes: row.total_keystrokes,
    accuracy: row.accuracy,
    correctWords: row.correct_words,
    perfectWords: row.perfect_words,
    totalWords: row.total_words,
    totalTime: row.total_time,
    playedAt: row.played_at,
  }))
}

export async function createGameScore(
  db: D1Database,
  input: CreateGameScoreInput
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO game_scores (kps, total_keystrokes, accuracy, correct_words, perfect_words, total_words, total_time, played_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      input.kps,
      input.totalKeystrokes,
      input.accuracy,
      input.correctWords,
      input.perfectWords,
      input.totalWords,
      input.totalTime,
      Date.now()
    )
    .run()

  return result.meta.last_row_id ?? 0
}

export async function deleteAllGameScores(db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM game_scores').run()
}
