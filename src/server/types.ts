import type {
  KeyStats,
  KeyTransitionStats,
  WordCountPreset,
  ThemeType,
  PracticeMode,
  DifficultyPreset,
} from '../lib/types'

/**
 * Tursoデータベース（libSQL/SQLite）の生のレコード型（snake_case）
 *
 * デプロイ先:
 * - バックエンド: Cloudflare Workers
 * - フロントエンド: Cloudflare Pages
 * - データベース: Turso（クラウド）またはローカルSQLiteファイル
 *
 * 詳細は docs/TURSO_SETUP.md を参照してください。
 */
export interface WordRow {
  id: number
  text: string
  reading: string
  romaji: string
  correct: number
  miss: number
  last_played: number
  accuracy: number
  created_at: number
  mastery_level: number
  next_review_at: number
  consecutive_correct: number
}

// API用のWord型（camelCase）
export interface WordRecord {
  id: number
  text: string
  reading: string
  romaji: string
  correct: number
  miss: number
  lastPlayed: number
  accuracy: number
  createdAt: number
  masteryLevel: number
  nextReviewAt: number
  consecutiveCorrect: number
}

// Word作成用の型
export interface CreateWordInput {
  text: string
  reading: string
  romaji: string
  correct?: number
  miss?: number
  lastPlayed?: number
  accuracy?: number
  createdAt?: number
  masteryLevel?: number
  nextReviewAt?: number
  consecutiveCorrect?: number
}

// Word更新用の型
export interface UpdateWordInput {
  correct?: number
  miss?: number
  lastPlayed?: number
  accuracy?: number
  masteryLevel?: number
  nextReviewAt?: number
  consecutiveCorrect?: number
}

// Bulk insert用の型
export interface BulkInsertWord {
  text: string
  reading: string
  romaji: string
}

export interface BulkInsertInput {
  words: BulkInsertWord[]
  clearExisting?: boolean
}

export interface BulkInsertWordWithStats {
  text: string
  reading: string
  romaji: string
  correct?: number
  miss?: number
  lastPlayed?: number
  accuracy?: number
  masteryLevel?: number
  nextReviewAt?: number
  consecutiveCorrect?: number
}

export interface BulkInsertWithStatsInput {
  words: BulkInsertWordWithStats[]
  clearExisting?: boolean
}

/**
 * Aggregated Stats - Tursoデータベースの生のレコード型（snake_case）
 */
export interface AggregatedStatsRow {
  id: number
  key_stats: string
  transition_stats: string
  last_updated: number
}

export interface AggregatedStatsRecord {
  id: number
  keyStats: Record<string, KeyStats>
  transitionStats: Record<string, KeyTransitionStats>
  lastUpdated: number
}

export interface UpdateAggregatedStatsInput {
  keyStats?: Record<string, KeyStats>
  transitionStats?: Record<string, KeyTransitionStats>
  lastUpdated?: number
}

/**
 * Settings - Tursoデータベースの生のレコード型（snake_case）
 */
export interface SettingsRow {
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
  min_time_limit_by_difficulty: number
  miss_penalty_enabled: number
  base_penalty_percent: number
  penalty_escalation_factor: number
  max_penalty_percent: number
  min_time_after_penalty: number
  updated_at: number
}

export interface SettingsRecord {
  id: number
  wordCount: WordCountPreset
  theme: ThemeType
  practiceMode: PracticeMode
  srsEnabled: boolean
  warmupEnabled: boolean
  difficultyPreset: DifficultyPreset
  timeLimitMode: string
  fixedTimeLimit: number
  comfortZoneRatio: number
  minTimeLimit: number
  maxTimeLimit: number
  minTimeLimitByDifficulty: number
  missPenaltyEnabled: boolean
  basePenaltyPercent: number
  penaltyEscalationFactor: number
  maxPenaltyPercent: number
  minTimeAfterPenalty: number
  updatedAt: number
}

export interface UpdateSettingsInput {
  wordCount?: WordCountPreset
  theme?: ThemeType
  practiceMode?: PracticeMode
  srsEnabled?: boolean
  warmupEnabled?: boolean
  difficultyPreset?: DifficultyPreset
  timeLimitMode?: string
  fixedTimeLimit?: number
  comfortZoneRatio?: number
  minTimeLimit?: number
  maxTimeLimit?: number
  minTimeLimitByDifficulty?: number
  missPenaltyEnabled?: boolean
  basePenaltyPercent?: number
  penaltyEscalationFactor?: number
  maxPenaltyPercent?: number
  minTimeAfterPenalty?: number
}

/**
 * Game Scores - Tursoデータベースの生のレコード型（snake_case）
 */
export interface GameScoreRow {
  id: number
  kps: number
  total_keystrokes: number
  accuracy: number
  correct_words: number
  perfect_words: number
  total_words: number
  total_time: number
  played_at: number
}

export interface GameScoreRecord {
  id: number
  kps: number
  totalKeystrokes: number
  accuracy: number
  correctWords: number
  perfectWords: number
  totalWords: number
  totalTime: number
  playedAt: number
}

export interface CreateGameScoreInput {
  kps: number
  totalKeystrokes: number
  accuracy: number
  correctWords: number
  perfectWords: number
  totalWords: number
  totalTime: number
}

// API レスポンス型
export interface ApiResponse<T = unknown> {
  success?: boolean
  data?: T
  error?: string
}

export interface BulkInsertResult {
  success: boolean
  insertedCount: number
  totalWords: number
}

import type { Client } from '@libsql/client'
import type { PresetWord } from '../lib/types'

/**
 * Presets - Tursoデータベースの生のレコード型（snake_case）
 */
export interface PresetRow {
  id: string
  name: string
  description: string
  difficulty: string
  word_count: number
  created_at: number
  updated_at: number
}

export interface PresetWordRow {
  id: number
  preset_id: string
  text: string
  reading: string
  romaji: string
  word_order: number
  created_at: number
}

export interface PresetRecord {
  id: string
  name: string
  description: string
  difficulty: 'easy' | 'normal' | 'hard'
  wordCount: number
  words: PresetWord[]
  createdAt: number
  updatedAt: number
}

export interface CreatePresetInput {
  id: string
  name: string
  description: string
  difficulty: 'easy' | 'normal' | 'hard'
  words: PresetWord[]
}

export interface UpdatePresetInput {
  name?: string
  description?: string
  difficulty?: 'easy' | 'normal' | 'hard'
  words?: PresetWord[]
}

/**
 * User Presets - ユーザーが保存したプリセット（統計データを含む）
 */
export interface UserPresetRow {
  id: string
  name: string
  description: string | null
  difficulty: string
  word_count: number
  created_at: number
  updated_at: number
}

export interface UserPresetWordRow {
  id: number
  preset_id: string
  text: string
  reading: string
  romaji: string
  word_order: number
  correct: number
  miss: number
  last_played: number
  accuracy: number
  mastery_level: number
  next_review_at: number
  consecutive_correct: number
  created_at: number
}

export interface UserPresetWord {
  text: string
  reading: string
  romaji: string
  stats: {
    correct: number
    miss: number
    lastPlayed: number
    accuracy: number
    masteryLevel: number
    nextReviewAt: number
    consecutiveCorrect: number
  }
}

export interface UserPresetRecord {
  id: string
  name: string
  description: string
  difficulty: 'easy' | 'normal' | 'hard'
  wordCount: number
  words: UserPresetWord[]
  createdAt: number
  updatedAt: number
}

export interface CreateUserPresetInput {
  id: string
  name: string
  description?: string
  difficulty: 'easy' | 'normal' | 'hard'
  words: UserPresetWord[]
}

export interface UpdateUserPresetInput {
  name?: string
  description?: string
  difficulty?: 'easy' | 'normal' | 'hard'
  words?: UserPresetWord[]
}

/**
 * サーバー環境変数の型定義（Turso対応）
 *
 * デプロイ先:
 * - Cloudflare Workers（wrangler.tomlで設定）
 * - ローカル開発時はBunサーバー（src/server/server.ts）も使用可能
 */
export interface Env {
  /** Tursoクライアント（サーバー起動時に初期化される） */
  DB?: Client
  /** TursoデータベースURL（libsql://... または file:...） */
  TURSO_DATABASE_URL?: string
  /** Turso認証トークン（リモートデータベースの場合のみ必要） */
  TURSO_AUTH_TOKEN?: string
  /** CORS許可オリジン（カンマ区切り） */
  ALLOWED_ORIGINS?: string
}
