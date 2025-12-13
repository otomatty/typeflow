import type { Word, AppSettings } from './types'
import type { GameScoreRecord } from './db'
import { normalizeRomaji } from './romaji-utils'

// 新規ユーザー用のデフォルトKPS（初心者レベル）
const DEFAULT_KPS = 3.0

// KPS計算に使用する最新スコア数
const RECENT_SCORES_FOR_KPS = 10

/**
 * 過去のゲームスコアから直近10ゲームの平均KPSを計算
 */
export function calculateAverageKps(gameScores: GameScoreRecord[]): number {
  if (gameScores.length === 0) {
    return DEFAULT_KPS
  }

  // playedAtでソート（新しい順）して直近10ゲームを取得
  const recentScores = [...gameScores]
    .filter(score => score.kps > 0 && score.totalTime > 0)
    .sort((a, b) => b.playedAt - a.playedAt)
    .slice(0, RECENT_SCORES_FOR_KPS)

  if (recentScores.length === 0) {
    return DEFAULT_KPS
  }

  // 単純平均を計算
  const sum = recentScores.reduce((acc, score) => acc + score.kps, 0)
  return sum / recentScores.length
}

/**
 * 信頼度を計算（0.0〜1.0）
 * データが少ないほど低い
 */
export function calculateKpsConfidence(gameScores: GameScoreRecord[]): number {
  const validScores = gameScores.filter(score => score.kps > 0 && score.totalTime > 0)
  
  if (validScores.length === 0) {
    return 0
  }
  
  // 10ゲームで100%の信頼度
  return Math.min(validScores.length / RECENT_SCORES_FOR_KPS, 1.0)
}

/**
 * 単語の打鍵数を取得（ローマ字の正規化後の文字数）
 */
export function getWordKeystrokeCount(word: Word): number {
  return normalizeRomaji(word.romaji).length
}

/**
 * 適応型の制限時間を計算
 * 
 * @param word - 現在の単語
 * @param averageKps - ユーザーの平均KPS
 * @param settings - アプリ設定
 * @param confidence - KPS計算の信頼度（0.0〜1.0）
 * @returns 制限時間（秒）
 */
export function calculateAdaptiveTimeLimit(
  word: Word,
  averageKps: number,
  settings: AppSettings,
  confidence: number = 1.0
): number {
  const keystrokeCount = getWordKeystrokeCount(word)
  
  // 理論上の必要時間（秒）
  const theoreticalTime = keystrokeCount / averageKps
  
  // コンフォートゾーン係数を適用
  // 信頼度が低い場合は係数を緩和（より多くの時間を与える）
  const adjustedRatio = settings.comfortZoneRatio + (1 - confidence) * (1 - settings.comfortZoneRatio)
  
  // 調整後の制限時間
  let adaptiveTime = theoreticalTime / adjustedRatio
  
  // 最小・最大制限を適用
  adaptiveTime = Math.max(settings.minTimeLimit, Math.min(settings.maxTimeLimit, adaptiveTime))
  
  // 小数点第1位まで丸める
  return Math.round(adaptiveTime * 10) / 10
}

/**
 * 単語の制限時間を計算（問題ごとに独立）
 * 
 * @param word - 対象の単語
 * @param gameScores - 過去のゲームスコア
 * @param settings - アプリ設定
 * @returns 制限時間（秒）
 */
export function calculateWordTimeLimit(
  word: Word,
  gameScores: GameScoreRecord[],
  settings: AppSettings
): number {
  if (settings.timeLimitMode === 'fixed') {
    return settings.fixedTimeLimit
  }
  
  // 適応型モード
  const averageKps = calculateAverageKps(gameScores)
  const confidence = calculateKpsConfidence(gameScores)
  return calculateAdaptiveTimeLimit(word, averageKps, settings, confidence)
}

/**
 * 現在の難易度レベルを表すテキストを取得
 * @deprecated 代わりに difficulty-presets.ts の getDifficultyLabel を使用してください
 */
export function getDifficultyLabel(comfortZoneRatio: number): string {
  if (comfortZoneRatio >= 0.95) {
    return 'やさしい'
  } else if (comfortZoneRatio >= 0.85) {
    return 'ふつう'
  } else if (comfortZoneRatio >= 0.75) {
    return 'むずかしい'
  } else {
    return 'エキスパート'
  }
}

/**
 * KPSステータスを取得（ユーザーへの表示用）
 */
export function getKpsStatus(gameScores: GameScoreRecord[]): {
  averageKps: number
  confidence: number
  gamesPlayed: number
  label: string
} {
  const averageKps = calculateAverageKps(gameScores)
  const confidence = calculateKpsConfidence(gameScores)
  const gamesPlayed = gameScores.filter(s => s.kps > 0).length
  
  let label: string
  if (confidence < 0.3) {
    label = 'データ収集中...'
  } else if (confidence < 0.7) {
    label = '学習中'
  } else {
    label = '安定'
  }
  
  return {
    averageKps: Math.round(averageKps * 10) / 10,
    confidence: Math.round(confidence * 100),
    gamesPlayed,
    label,
  }
}

