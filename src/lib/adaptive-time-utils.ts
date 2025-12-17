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
 * 目標KPSを計算（現在の平均KPS × 倍率）
 *
 * @param averageKps - 現在の平均KPS
 * @param targetKpsMultiplier - 目標KPSの倍率
 * @returns 目標KPS
 */
export function calculateTargetKps(averageKps: number, targetKpsMultiplier: number): number {
  return Math.round(averageKps * targetKpsMultiplier * 10) / 10
}

/**
 * 目標KPSベースの制限時間を計算
 *
 * 計算式: 制限時間 = (打鍵数 / 目標KPS) × comfortZoneRatio
 *
 * @param word - 対象の単語
 * @param targetKps - 目標KPS
 * @param comfortZoneRatio - 難易度に応じた時間倍率（1.0 = 目標ぴったり）
 * @param minTimeLimit - 最小制限時間
 * @param maxTimeLimit - 最大制限時間
 * @returns 制限時間（秒）
 */
export function calculateTargetKpsTimeLimit(
  word: Word,
  targetKps: number,
  comfortZoneRatio: number,
  minTimeLimit: number,
  maxTimeLimit: number
): number {
  const keystrokeCount = getWordKeystrokeCount(word)

  // 理論時間 = 打鍵数 / 目標KPS
  const theoreticalTime = keystrokeCount / targetKps

  // 難易度調整後の時間
  let adjustedTime = theoreticalTime * comfortZoneRatio

  // 最小・最大制限を適用
  adjustedTime = Math.max(minTimeLimit, Math.min(maxTimeLimit, adjustedTime))

  // 小数点第1位まで丸める
  return Math.round(adjustedTime * 10) / 10
}

/**
 * 単語の制限時間を計算（設定と過去のスコアに基づく）
 *
 * @param word - 対象の単語
 * @param gameScores - 過去のゲームスコア（平均KPS計算用）
 * @param settings - アプリ設定
 * @returns 制限時間（秒）
 */
export function calculateWordTimeLimit(
  word: Word,
  gameScores: GameScoreRecord[],
  settings: Pick<
    AppSettings,
    | 'targetKpsMultiplier'
    | 'comfortZoneRatio'
    | 'minTimeLimit'
    | 'maxTimeLimit'
    | 'minTimeLimitByDifficulty'
  >
): number {
  const averageKps = calculateAverageKps(gameScores)
  const targetKps = calculateTargetKps(averageKps, settings.targetKpsMultiplier)

  // まず通常の計算を行う
  const calculatedTime = calculateTargetKpsTimeLimit(
    word,
    targetKps,
    settings.comfortZoneRatio,
    settings.minTimeLimit,
    settings.maxTimeLimit
  )

  // 難易度ごとの最低制限時間と比較して、大きい方を採用
  const finalTime = Math.max(calculatedTime, settings.minTimeLimitByDifficulty)

  // 最大制限時間も考慮
  return Math.min(finalTime, settings.maxTimeLimit)
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

/**
 * 目標KPSの情報を取得（設定画面表示用）
 */
export function getTargetKpsInfo(
  gameScores: GameScoreRecord[],
  targetKpsMultiplier: number
): {
  averageKps: number
  targetKps: number
  percentDiff: number
  isFaster: boolean
} {
  const averageKps = calculateAverageKps(gameScores)
  const targetKps = calculateTargetKps(averageKps, targetKpsMultiplier)
  const percentDiff = Math.round((targetKpsMultiplier - 1) * 100)
  const isFaster = percentDiff > 0

  return {
    averageKps: Math.round(averageKps * 10) / 10,
    targetKps,
    percentDiff: Math.abs(percentDiff),
    isFaster,
  }
}

/**
 * 制限時間の例を計算（設定画面表示用）
 */
export function calculateTimeLimitExample(
  keystrokeCount: number,
  averageKps: number,
  targetKpsMultiplier: number,
  comfortZoneRatio: number,
  minTimeLimit: number,
  maxTimeLimit: number,
  minTimeLimitByDifficulty: number
): number {
  const targetKps = calculateTargetKps(averageKps, targetKpsMultiplier)
  const theoreticalTime = keystrokeCount / targetKps
  let adjustedTime = theoreticalTime * comfortZoneRatio
  adjustedTime = Math.max(minTimeLimit, Math.min(maxTimeLimit, adjustedTime))
  // 難易度ごとの最低制限時間と比較して、大きい方を採用
  adjustedTime = Math.max(adjustedTime, minTimeLimitByDifficulty)
  return Math.round(adjustedTime * 10) / 10
}
