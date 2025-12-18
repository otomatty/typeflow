import type { Client } from '@libsql/client'
import type { WordCountPreset, ThemeType, PracticeMode, DifficultyPreset } from '../lib/types'
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
export async function getAllWords(db: Client): Promise<WordRecord[]> {
  const result = await db.execute('SELECT * FROM words ORDER BY created_at DESC')
  return result.rows.map(row => wordRowToRecord(row as unknown as WordRow))
}

export async function getWordById(db: Client, id: number): Promise<WordRecord | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM words WHERE id = ?',
    args: [id],
  })
  const row = result.rows[0] as unknown as WordRow | undefined
  return row ? wordRowToRecord(row) : null
}

export async function createWord(db: Client, input: CreateWordInput): Promise<number> {
  await db.execute({
    sql: `INSERT INTO words (text, reading, romaji, correct, miss, last_played, accuracy, created_at, mastery_level, next_review_at, consecutive_correct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
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
      input.consecutiveCorrect ?? 0,
    ],
  })

  // libSQLではlastInsertRowidを取得するために別のクエリが必要
  const lastIdResult = await db.execute('SELECT last_insert_rowid() as id')
  return (lastIdResult.rows[0]?.id as number) ?? 0
}

export async function updateWord(db: Client, id: number, input: UpdateWordInput): Promise<void> {
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
    await db.execute({
      sql: `UPDATE words SET ${updates.join(', ')} WHERE id = ?`,
      args: values,
    })
  }
}

export async function deleteWord(db: Client, id: number): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM words WHERE id = ?',
    args: [id],
  })
}

export async function deleteAllWords(db: Client): Promise<void> {
  await db.execute('DELETE FROM words')
}

export async function bulkInsertWords(
  db: Client,
  words: BulkInsertWord[],
  clearExisting: boolean = false
): Promise<number> {
  if (clearExisting) {
    await deleteAllWords(db)
  }

  const now = Date.now()
  let insertedCount = 0

  // バッチ処理で挿入
  const statements = words.map(word => ({
    sql: `INSERT INTO words (text, reading, romaji, correct, miss, last_played, accuracy, created_at, mastery_level, next_review_at, consecutive_correct)
     VALUES (?, ?, ?, 0, 0, 0, 100, ?, 0, 0, 0)`,
    args: [word.text, word.reading, word.romaji, now],
  }))

  const results = await db.batch(statements)

  for (const result of results) {
    if (result.rowsAffected > 0) {
      insertedCount++
    }
  }

  return insertedCount
}

// Aggregated Stats操作
export async function getAggregatedStats(db: Client): Promise<AggregatedStatsRecord | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM aggregated_stats WHERE id = 1',
  })

  const row = result.rows[0] as unknown as AggregatedStatsRow | undefined
  if (!row) {
    return null
  }

  return {
    id: row.id,
    keyStats: JSON.parse(row.key_stats),
    transitionStats: JSON.parse(row.transition_stats),
    lastUpdated: row.last_updated,
  }
}

export async function upsertAggregatedStats(
  db: Client,
  input: AggregatedStatsRecord
): Promise<void> {
  await db.execute({
    sql: `INSERT OR REPLACE INTO aggregated_stats (id, key_stats, transition_stats, last_updated)
       VALUES (1, ?, ?, ?)`,
    args: [
      JSON.stringify(input.keyStats ?? {}),
      JSON.stringify(input.transitionStats ?? {}),
      input.lastUpdated ?? Date.now(),
    ],
  })
}

export async function deleteAggregatedStats(db: Client): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM aggregated_stats WHERE id = 1',
  })
}

// Settings操作
export async function getSettings(db: Client): Promise<SettingsRecord | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM settings WHERE id = 1',
  })

  const row = result.rows[0] as unknown as SettingsRow | undefined
  if (!row) {
    return null
  }

  return {
    id: row.id,
    wordCount: row.word_count as WordCountPreset,
    theme: row.theme as ThemeType,
    practiceMode: row.practice_mode as PracticeMode,
    srsEnabled: Boolean(row.srs_enabled),
    warmupEnabled: Boolean(row.warmup_enabled),
    difficultyPreset: row.difficulty_preset as DifficultyPreset,
    timeLimitMode: row.time_limit_mode,
    fixedTimeLimit: row.fixed_time_limit,
    comfortZoneRatio: row.comfort_zone_ratio,
    minTimeLimit: row.min_time_limit,
    maxTimeLimit: row.max_time_limit,
    minTimeLimitByDifficulty: row.min_time_limit_by_difficulty ?? 1.5,
    missPenaltyEnabled: Boolean(row.miss_penalty_enabled),
    basePenaltyPercent: row.base_penalty_percent,
    penaltyEscalationFactor: row.penalty_escalation_factor,
    maxPenaltyPercent: row.max_penalty_percent,
    minTimeAfterPenalty: row.min_time_after_penalty,
    updatedAt: row.updated_at,
  }
}

export async function upsertSettings(db: Client, input: UpdateSettingsInput): Promise<void> {
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
      await db.execute({
        sql: `UPDATE settings SET ${updates.join(', ')} WHERE id = 1`,
        args: values,
      })
    }
  } else {
    await db.execute({
      sql: `INSERT INTO settings (id, word_count, theme, practice_mode, srs_enabled, warmup_enabled, difficulty_preset, time_limit_mode, fixed_time_limit, comfort_zone_ratio, min_time_limit, max_time_limit, min_time_limit_by_difficulty, miss_penalty_enabled, base_penalty_percent, penalty_escalation_factor, max_penalty_percent, min_time_after_penalty, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
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
        Date.now(),
      ],
    })
  }
}

// Game Scores操作
export async function getAllGameScores(db: Client): Promise<GameScoreRecord[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM game_scores ORDER BY played_at DESC',
  })

  return result.rows.map(row => {
    const r = row as unknown as GameScoreRow
    return {
      id: r.id,
      kps: r.kps,
      totalKeystrokes: r.total_keystrokes,
      accuracy: r.accuracy,
      correctWords: r.correct_words,
      perfectWords: r.perfect_words,
      totalWords: r.total_words,
      totalTime: r.total_time,
      playedAt: r.played_at,
    }
  })
}

export async function createGameScore(db: Client, input: CreateGameScoreInput): Promise<number> {
  await db.execute({
    sql: `INSERT INTO game_scores (kps, total_keystrokes, accuracy, correct_words, perfect_words, total_words, total_time, played_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      input.kps,
      input.totalKeystrokes,
      input.accuracy,
      input.correctWords,
      input.perfectWords,
      input.totalWords,
      input.totalTime,
      Date.now(),
    ],
  })

  // libSQLではlastInsertRowidを取得するために別のクエリが必要
  const lastIdResult = await db.execute('SELECT last_insert_rowid() as id')
  return (lastIdResult.rows[0]?.id as number) ?? 0
}

export async function deleteAllGameScores(db: Client): Promise<void> {
  await db.execute('DELETE FROM game_scores')
}
