import type { KeyStats, KeyTransitionStats, AppSettings, WordCountPreset, ThemeType, PresetWord, GameStats, PracticeMode, DifficultyPreset } from './types'

// APIベースURL
const API_BASE = 'http://localhost:3456/api'

// Word interface for database
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
  // SRS (Spaced Repetition System) 用フィールド
  masteryLevel: number        // 習熟度レベル (0-5)
  nextReviewAt: number        // 次回復習推奨時刻 (timestamp)
  consecutiveCorrect: number  // 連続正解数
}

// Aggregated stats record for database
export interface AggregatedStatsRecord {
  id: number  // 常に1（シングルトン）
  keyStats: Record<string, KeyStats>
  transitionStats: Record<string, KeyTransitionStats>
  lastUpdated: number
}

// Settings record for database
export interface SettingsRecord {
  id: number  // 常に1（シングルトン）
  wordCount: WordCountPreset
  theme: ThemeType
  practiceMode: PracticeMode
  srsEnabled: boolean
  warmupEnabled: boolean
  // 難易度設定
  difficultyPreset: DifficultyPreset
  // 制限時間設定（難易度に応じて自動計算）
  targetKpsMultiplier: number
  comfortZoneRatio: number
  minTimeLimit: number
  maxTimeLimit: number
  // ミスペナルティ設定
  missPenaltyEnabled: boolean
  basePenaltyPercent: number
  penaltyEscalationFactor: number
  maxPenaltyPercent: number
  minTimeAfterPenalty: number
  updatedAt: number
}

// Game score record for database
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

// API helper
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}

// Helper functions for CRUD operations
export async function getAllWords(): Promise<WordRecord[]> {
  return api<WordRecord[]>('/words')
}

export async function addWord(word: Omit<WordRecord, 'id'>): Promise<number> {
  const result = await api<{ id: number }>('/words', {
    method: 'POST',
    body: JSON.stringify(word),
  })
  return result.id
}

export async function deleteWord(id: number): Promise<void> {
  await api(`/words/${id}`, { method: 'DELETE' })
}

export async function updateWord(id: number, updates: Partial<WordRecord>): Promise<void> {
  await api(`/words/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function updateWordStats(id: number, correct: boolean): Promise<void> {
  // まず現在の単語を取得
  const words = await getAllWords()
  const word = words.find(w => w.id === id)
  if (!word) return

  const newCorrect = correct ? word.correct + 1 : word.correct
  const newMiss = correct ? word.miss : word.miss + 1
  const total = newCorrect + newMiss
  const accuracy = total > 0 ? (newCorrect / total) * 100 : 100

  await updateWord(id, {
    correct: newCorrect,
    miss: newMiss,
    lastPlayed: Date.now(),
    accuracy,
  })
}

// Bulk insert for presets
export interface BulkInsertResult {
  success: boolean
  insertedCount: number
  totalWords: number
}

export async function bulkInsertWords(
  words: PresetWord[],
  clearExisting: boolean = false
): Promise<BulkInsertResult> {
  return api<BulkInsertResult>('/words/bulk', {
    method: 'POST',
    body: JSON.stringify({
      words,
      clearExisting,
    }),
  })
}

// Delete all words
export async function deleteAllWords(): Promise<void> {
  await api('/words', { method: 'DELETE' })
}

// Aggregated stats helper functions
export async function getAggregatedStats(): Promise<AggregatedStatsRecord | undefined> {
  const result = await api<AggregatedStatsRecord | null>('/stats')
  return result ?? undefined
}

export async function saveAggregatedStats(stats: Omit<AggregatedStatsRecord, 'id'>): Promise<void> {
  await api('/stats', {
    method: 'PUT',
    body: JSON.stringify(stats),
  })
}

export async function initializeAggregatedStats(): Promise<AggregatedStatsRecord> {
  const existing = await getAggregatedStats()
  if (existing) {
    return existing
  }
  
  const newStats: Omit<AggregatedStatsRecord, 'id'> = {
    keyStats: {},
    transitionStats: {},
    lastUpdated: Date.now(),
  }
  
  await saveAggregatedStats(newStats)
  return { id: 1, ...newStats }
}

export async function resetAggregatedStats(): Promise<void> {
  await api('/stats', { method: 'DELETE' })
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  wordCount: 'all',
  theme: 'dark',
  practiceMode: 'balanced',
  srsEnabled: true,
  warmupEnabled: true,
  // 難易度設定（デフォルトは「ふつう」）
  difficultyPreset: 'normal',
  // 制限時間設定（難易度に応じて自動計算）
  targetKpsMultiplier: 1.05,           // normalプリセット相当（5%速い目標）
  comfortZoneRatio: 1.0,               // 1.0 = 目標KPSぴったりの制限時間
  minTimeLimit: 1.5,                   // 最小1.5秒（あまりに短すぎないように）
  maxTimeLimit: 15,                    // 最大15秒（長すぎないように）
  // ミスペナルティのデフォルト設定（normalプリセット相当）
  missPenaltyEnabled: true,            // デフォルトで有効
  basePenaltyPercent: 5,               // 基本5%減少
  penaltyEscalationFactor: 1.5,        // ミスごとに1.5倍
  maxPenaltyPercent: 30,               // 最大30%
  minTimeAfterPenalty: 0.5,            // 最低0.5秒は残す
}

// Settings helper functions
export async function getSettings(): Promise<SettingsRecord | undefined> {
  const result = await api<SettingsRecord | null>('/settings')
  return result ?? undefined
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  await api('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}

export async function initializeSettings(): Promise<SettingsRecord> {
  const existing = await getSettings()
  if (existing) {
    return existing
  }
  
  await saveSettings(DEFAULT_SETTINGS)
  return {
    id: 1,
    ...DEFAULT_SETTINGS,
    updatedAt: Date.now(),
  }
}

// Game Scores helper functions
export async function getAllGameScores(): Promise<GameScoreRecord[]> {
  return api<GameScoreRecord[]>('/scores')
}

export async function saveGameScore(score: Omit<GameScoreRecord, 'id' | 'playedAt'>): Promise<number> {
  const result = await api<{ id: number }>('/scores', {
    method: 'POST',
    body: JSON.stringify(score),
  })
  return result.id
}

export async function resetGameScores(): Promise<void> {
  await api('/scores', { method: 'DELETE' })
}

// 互換性のためのダミー db オブジェクト（Dexie から移行時に必要な場合）
export const db = {
  // Dexie互換のダミー - 必要に応じて拡張
}
