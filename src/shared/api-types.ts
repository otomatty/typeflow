/**
 * クライアント(src/lib/db.ts)とサーバー(src/server/types.ts)で
 * 共有する API レコード型の単一定義。
 *
 * 以前は同一の型が両側で個別に定義されており、片方だけ変更しても
 * コンパイラが不整合を検出できなかった。ここに集約することで
 * 型のドリフトを防ぐ。
 *
 * 注意: SettingsRecord / AggregatedStatsRecord はクライアントと
 * サーバーで保持するフィールドが異なる（クライアントは minimalMode 等の
 * UI 専用設定を持つ）ため、ここには含めず各側で定義する。
 */

// 単語レコード（DB の camelCase 表現）
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
  masteryLevel: number // 習熟度レベル (0-5)
  nextReviewAt: number // 次回復習推奨時刻 (timestamp)
  consecutiveCorrect: number // 連続正解数
}

// ゲームスコアレコード
export interface GameScoreRecord {
  id: number
  kps: number
  totalKeystrokes: number
  accuracy: number
  completedWords: number // 入力完了した単語数（時間切れでないもの）
  successfulWords: number // 成功した単語数（ミスなく完了）
  totalWords: number
  totalTime: number
  playedAt: number
}

// ユーザープリセットの単語（統計データ付き）
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

// ユーザープリセットレコード
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

// ユーザープリセット作成入力
export interface CreateUserPresetInput {
  id: string
  name: string
  description?: string
  difficulty: 'easy' | 'normal' | 'hard'
  words: UserPresetWord[]
}
