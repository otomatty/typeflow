/**
 * CLI Practice Types
 * CLIタイピング練習で使用する型定義
 */

// 偽装モードの種類
export type DisplayMode = 'minimal' | 'log' | 'test' | 'build' | 'git'

// CLIオプション
export interface CLIOptions {
  mode: DisplayMode
  count: number | 'all'
  difficulty: 'easy' | 'normal' | 'hard' | 'expert'
  quiet: boolean
  noSave: boolean
}

// 単語データ（APIから取得）
export interface CLIWord {
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

// ゲームスコア（APIから取得）
export interface CLIGameScore {
  id: number
  kps: number
  totalKeystrokes: number
  accuracy: number
  completedWords: number
  successfulWords: number
  totalWords: number
  totalTime: number
  playedAt: number
}

// 設定（APIから取得）
export interface CLISettings {
  wordCount: number | 'all'
  theme: string
  practiceMode: string
  srsEnabled: boolean
  warmupEnabled: boolean
  difficultyPreset: string
  targetKpsMultiplier: number
  comfortZoneRatio: number
  minTimeLimit: number
  maxTimeLimit: number
  minTimeLimitByDifficulty: number
  missPenaltyEnabled: boolean
  basePenaltyPercent: number
  penaltyEscalationFactor: number
  maxPenaltyPercent: number
  minTimeAfterPenalty: number
}

// 単語ごとの結果
export interface WordResult {
  wordId: number
  text: string
  reading: string
  romaji: string
  success: boolean // ミスなく完了
  completed: boolean // 時間内に完了
  missCount: number
  completionTime: number // ms
  reactionTime: number // 初動時間 ms
}

// ゲーム結果
export interface GameResult {
  kps: number
  totalKeystrokes: number
  accuracy: number
  completedWords: number
  successfulWords: number
  failedWords: number
  totalWords: number
  totalTime: number // seconds
  wordResults: WordResult[]
}

// 現在の単語の状態
export interface CurrentWordState {
  word: CLIWord
  input: string
  timeRemaining: number
  totalTime: number
  missCount: number
  startTime: number
  firstKeyTime: number | null
}

// ゲーム全体の状態
export interface GameState {
  isPlaying: boolean
  words: CLIWord[]
  currentIndex: number
  currentWord: CurrentWordState | null
  totalKeystrokes: number
  startTime: number | null
  wordResults: WordResult[]
}

// 表示用のデータ
export interface DisplayData {
  // 単語情報
  text: string
  reading: string
  romaji: string
  input: string

  // 進捗
  currentIndex: number
  totalWords: number

  // タイマー
  timeRemaining: number
  totalTime: number

  // 統計
  kps: number
  accuracy: number
  missCount: number

  // 状態
  isError: boolean
  isComplete: boolean
  isTimeout: boolean
}
