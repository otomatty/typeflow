/**
 * 難易度プリセット定義
 * ゲーム全体で共通の難易度設定を管理
 */

import type { DifficultyPreset, DifficultyParams } from './types'

// 各難易度プリセットのパラメータ
// targetKpsMultiplier: 目標KPSの倍率（現在のKPSに対する比率）
// comfortZoneRatio: 制限時間の倍率（1.0 = 目標KPSぴったり、>1.0 = 余裕あり）
export const DIFFICULTY_PRESETS: Record<DifficultyPreset, DifficultyParams> = {
  easy: {
    // 目標: 現在より30%速い（旧expertレベル）
    targetKpsMultiplier: 1.30,
    // 制限時間: 5%厳しい（旧expertレベル）
    comfortZoneRatio: 0.95,
    // ミスペナルティ: 非常に厳しい（旧expertレベル）
    missPenaltyEnabled: true,
    basePenaltyPercent: 10,
    penaltyEscalationFactor: 2.0,
    maxPenaltyPercent: 50,
    minTimeAfterPenalty: 0.2,
  },
  normal: {
    // 目標: 現在より40%速い（旧expertより高い）
    targetKpsMultiplier: 1.40,
    // 制限時間: 10%厳しい
    comfortZoneRatio: 0.90,
    // ミスペナルティ: より厳しい
    missPenaltyEnabled: true,
    basePenaltyPercent: 12,
    penaltyEscalationFactor: 2.2,
    maxPenaltyPercent: 55,
    minTimeAfterPenalty: 0.15,
  },
  hard: {
    // 目標: 現在より50%速い
    targetKpsMultiplier: 1.50,
    // 制限時間: 15%厳しい
    comfortZoneRatio: 0.85,
    // ミスペナルティ: 非常に厳しい
    missPenaltyEnabled: true,
    basePenaltyPercent: 15,
    penaltyEscalationFactor: 2.5,
    maxPenaltyPercent: 60,
    minTimeAfterPenalty: 0.1,
  },
  expert: {
    // 目標: 現在より65%速い
    targetKpsMultiplier: 1.65,
    // 制限時間: 20%厳しい（極限レベル）
    comfortZoneRatio: 0.80,
    // ミスペナルティ: 極限レベル
    missPenaltyEnabled: true,
    basePenaltyPercent: 18,
    penaltyEscalationFactor: 2.8,
    maxPenaltyPercent: 65,
    minTimeAfterPenalty: 0.05,
  },
}

// 難易度プリセットの表示情報
export const DIFFICULTY_LABELS: Record<DifficultyPreset, { name: string; description: string }> = {
  easy: {
    name: 'やさしい',
    description: '上級者向け。タイトな制限時間と厳しいペナルティ（旧エキスパート相当）',
  },
  normal: {
    name: 'ふつう',
    description: '上級者向けの標準設定。多くの上級ユーザーにおすすめ',
  },
  hard: {
    name: 'むずかしい',
    description: '超上級者向け。非常にタイトな制限時間と厳しいペナルティ',
  },
  expert: {
    name: 'エキスパート',
    description: '極限レベル。限界に挑戦する上級者向け',
  },
}

/**
 * 難易度プリセットからパラメータを取得
 */
export function getDifficultyParams(preset: DifficultyPreset): DifficultyParams {
  return DIFFICULTY_PRESETS[preset]
}

/**
 * 難易度プリセットのラベルを取得
 */
export function getDifficultyLabel(preset: DifficultyPreset): string {
  return DIFFICULTY_LABELS[preset].name
}

/**
 * 難易度プリセットの説明を取得
 */
export function getDifficultyDescription(preset: DifficultyPreset): string {
  return DIFFICULTY_LABELS[preset].description
}

/**
 * ミスペナルティを計算
 * @param missCount - 現在の単語での累積ミス数（1から開始）
 * @param currentTimeRemaining - 現在の残り時間（秒）
 * @param params - 難易度パラメータ
 * @returns 減少する時間（秒）
 */
export function calculateMissPenalty(
  missCount: number,
  currentTimeRemaining: number,
  params: DifficultyParams
): number {
  if (!params.missPenaltyEnabled || missCount < 1) return 0
  
  // ペナルティ割合を計算（段階的に増加）
  const penaltyPercent = Math.min(
    params.basePenaltyPercent * Math.pow(params.penaltyEscalationFactor, missCount - 1),
    params.maxPenaltyPercent
  )
  
  // 減少時間を計算
  let penalty = currentTimeRemaining * (penaltyPercent / 100)
  
  // 最低残り時間を確保
  const maxAllowedPenalty = Math.max(0, currentTimeRemaining - params.minTimeAfterPenalty)
  penalty = Math.min(penalty, maxAllowedPenalty)
  
  // 小数点2位で丸める
  return Math.round(penalty * 100) / 100
}

/**
 * ペナルティ割合のプレビューを生成（設定画面用）
 */
export function generatePenaltyPreview(params: DifficultyParams, count: number = 5): number[] {
  const previews: number[] = []
  for (let i = 1; i <= count; i++) {
    const percent = Math.min(
      params.basePenaltyPercent * Math.pow(params.penaltyEscalationFactor, i - 1),
      params.maxPenaltyPercent
    )
    previews.push(Math.round(percent * 10) / 10)
  }
  return previews
}

