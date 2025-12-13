export interface Word {
  id: string
  text: string
  reading: string
  romaji: string
  stats: {
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
}

export interface GameState {
  isPlaying: boolean
  currentWordIndex: number
  currentInput: string
  timeRemaining: number
  totalTime: number
  words: Word[]
  mistakeWords: string[]
  correctCount: number
  totalKeystrokes: number
  startTime: number | null
}

export interface GameStats {
  kps: number           // Keys Per Second (打鍵/秒)
  totalKeystrokes: number  // 総打鍵数
  accuracy: number      // 正確率 (ノーミスワード数/完了ワード数)
  correctWords: number  // 完了ワード数
  perfectWords: number  // ノーミスで完了したワード数
  totalWords: number    // 総ワード数
  totalTime: number     // 総時間（秒）
}

// キーストローク単位の詳細記録
export interface KeystrokeRecord {
  key: string              // 期待されたキー
  actualKey: string        // 実際に押されたキー
  isCorrect: boolean       // 正しいかどうか
  timestamp: number        // タイムスタンプ
  latency: number          // 前のキーからの反応時間（ms）
  previousKey: string | null  // 直前のキー（キー遷移分析用）
}

// キー遷移（トランジション）の統計
export interface KeyTransitionStats {
  fromKey: string          // 遷移元のキー
  toKey: string            // 遷移先のキー
  totalCount: number       // 総試行回数
  errorCount: number       // ミス回数
  totalLatency: number     // 合計反応時間（平均計算用）
}

// キー単体の統計
export interface KeyStats {
  key: string
  totalCount: number
  errorCount: number
  totalLatency: number     // 合計反応時間（平均計算用）
  // ミスした時に押したキーの履歴（どのキーと間違えやすいか）
  confusedWith: Record<string, number>  // key -> count
}

// 集計統計（IndexedDBに保存）
export interface AggregatedStats {
  id: number               // 常に1（シングルトン）
  keyStats: Record<string, KeyStats>
  transitionStats: Record<string, KeyTransitionStats>
  lastUpdated: number
}

// 単語数設定（任意の数値または 'all'）
export type WordCountPreset = number | 'all'

// テーマ設定
export type ThemeType = 'light' | 'dark' | 'system'

// 練習モード
export type PracticeMode = 'balanced' | 'weakness-focus' | 'review' | 'random'

// 動的制限時間モード
export type TimeLimitMode = 'fixed' | 'adaptive'

// 共通難易度プリセット
export type DifficultyPreset = 'easy' | 'normal' | 'hard' | 'expert' | 'custom'

// 難易度に関連するパラメータ（プリセットで一括設定）
export interface DifficultyParams {
  // 適応型制限時間
  comfortZoneRatio: number          // コンフォートゾーン係数 (0.70〜1.00) - 低いほど挑戦的
  // ミスペナルティ
  missPenaltyEnabled: boolean       // ミスペナルティ有効化
  basePenaltyPercent: number        // 基本ペナルティ割合 (%)
  penaltyEscalationFactor: number   // ミスごとの倍率
  maxPenaltyPercent: number         // 最大ペナルティ割合 (%)
  minTimeAfterPenalty: number       // ペナルティ後の最低残り時間（秒）
}

// アプリ設定
export interface AppSettings {
  wordCount: WordCountPreset  // ゲームで出題する単語数
  theme: ThemeType            // テーマ設定
  practiceMode: PracticeMode  // 練習モード
  srsEnabled: boolean         // SRS（間隔反復システム）有効化
  warmupEnabled: boolean      // ウォームアップフェーズ有効化
  // 難易度設定
  difficultyPreset: DifficultyPreset  // 難易度プリセット
  // 動的制限時間設定
  timeLimitMode: TimeLimitMode      // 制限時間モード: fixed（固定） or adaptive（適応型）
  fixedTimeLimit: number            // 固定モード時の制限時間（秒）
  comfortZoneRatio: number          // コンフォートゾーン係数 (0.70〜1.00) - 低いほど挑戦的
  minTimeLimit: number              // 最小制限時間（秒）
  maxTimeLimit: number              // 最大制限時間（秒）
  // ミスペナルティ設定
  missPenaltyEnabled: boolean       // ミスペナルティ有効化
  basePenaltyPercent: number        // 基本ペナルティ割合 (%)
  penaltyEscalationFactor: number   // ミスごとの倍率
  maxPenaltyPercent: number         // 最大ペナルティ割合 (%)
  minTimeAfterPenalty: number       // ペナルティ後の最低残り時間（秒）
}

// プリセット単語データ
export interface PresetWord {
  text: string       // 表示テキスト（日本語）
  reading: string    // ふりがな
  romaji: string     // ローマ字
}

// プリセット定義
export interface WordPreset {
  id: string                    // プリセットID
  name: string                  // プリセット名
  description: string           // 説明
  difficulty: 'easy' | 'normal' | 'hard'  // 難易度
  wordCount: number             // 単語数
  words: PresetWord[]           // 単語リスト
}

// ゲームセッション状態（出題アルゴリズム用）
export interface GameSessionState {
  wordsPlayed: number           // 出題した単語数
  recentResults: boolean[]      // 直近N問の正誤履歴
  recentWordIds: string[]       // 直近N問で出題した単語ID
  sessionWordIds: Set<string>   // セッション内で出題済みの単語ID
  startedAt: number             // セッション開始時刻
}

// 単語スコアの内訳
export interface WordScoreBreakdown {
  weakness: number      // 弱点スコア
  timeDecay: number     // 時間経過スコア
  novelty: number       // 新規度スコア
  difficultyAdjust: number  // 難易度調整スコア
  random: number        // ランダムスコア
}

// スコア計算結果
export interface WordScore {
  wordId: string
  totalScore: number
  breakdown: WordScoreBreakdown
}

// スコアリングコンテキスト
export interface ScoringContext {
  weakKeys: Set<string>
  weakTransitions: Set<string>
  weakKeyScores: Map<string, number>
  weakTransitionScores: Map<string, number>
  recentCorrectRate: number
  practiceMode: PracticeMode
  srsEnabled: boolean
  warmupEnabled: boolean
}
