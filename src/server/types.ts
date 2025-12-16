import type { KeyStats, KeyTransitionStats, AppSettings, WordCountPreset, ThemeType, PracticeMode, DifficultyPreset } from '../lib/types'

// D1データベースの生のレコード型（snake_case）
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

// Aggregated Stats
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

// Settings
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
  missPenaltyEnabled?: boolean
  basePenaltyPercent?: number
  penaltyEscalationFactor?: number
  maxPenaltyPercent?: number
  minTimeAfterPenalty?: number
}

// Game Scores
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

import type { D1Database } from '@cloudflare/workers-types'

// Cloudflare Workers環境変数
export interface Env {
  DB: D1Database
  ALLOWED_ORIGINS?: string
}

