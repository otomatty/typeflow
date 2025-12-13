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

// 単語ごとのパフォーマンス記録（初動計測用）
export interface WordPerformanceRecord {
  wordId: string              // 単語ID
  wordText: string            // 表示テキスト
  reading: string             // ふりがな
  romaji: string              // ローマ字
  
  // 初動（ファーストキーストローク）
  firstKeyExpected: string    // 期待された最初のキー
  firstKeyActual: string      // 実際に押された最初のキー
  firstKeyCorrect: boolean    // 最初のキーが正しいか
  reactionTime: number        // 単語表示から最初のキー入力までの時間（ms）
  
  // 全体パフォーマンス
  totalTime: number           // 単語完了までの総時間（ms）
  keystrokeCount: number      // 総キーストローク数
  missCount: number           // ミス数
  completed: boolean          // 完了したか（タイムアウトでない）
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
  // 初動計測用
  wordStartTime: number | null     // 現在の単語の表示開始時刻
}

export interface GameStats {
  kps: number           // Keys Per Second (打鍵/秒)
  totalKeystrokes: number  // 総打鍵数
  accuracy: number      // 正確率 (ノーミスワード数/完了ワード数)
  correctWords: number  // 完了ワード数
  perfectWords: number  // ノーミスで完了したワード数
  totalWords: number    // 総ワード数
  totalTime: number     // 総時間（秒）
  // 初動統計
  avgReactionTime: number           // 平均初動時間（ms）
  firstKeyAccuracy: number          // 初動正確率（%）
  wordPerformances: WordPerformanceRecord[]  // 単語ごとの詳細
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
export type PracticeMode = 'random' | 'weakness-focus' | 'review' | 'balanced'

// 共通難易度プリセット
export type DifficultyPreset = 'easy' | 'normal' | 'hard' | 'expert'

// 難易度に関連するパラメータ（プリセットで一括設定）
export interface DifficultyParams {
  // 目標KPS（現在の平均KPSに対する倍率）
  targetKpsMultiplier: number       // 1.0 = 現在と同じ、1.1 = 10%速い目標
  // 制限時間の余裕
  comfortZoneRatio: number          // 1.0 = ぴったり、>1.0 = 余裕あり
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
  // 制限時間設定（難易度に応じて自動計算）
  targetKpsMultiplier: number       // 目標KPS倍率（現在のKPSに対する比率）
  comfortZoneRatio: number          // 制限時間の余裕（1.0 = ぴったり）
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
