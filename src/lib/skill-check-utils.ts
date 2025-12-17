import type { GameStats, DifficultyPreset } from './types'

/**
 * スキルチェック結果に基づいて適切な難易度を提案
 * @param stats - ゲーム統計
 * @returns 推奨難易度プリセット
 */
export function recommendDifficulty(stats: GameStats): DifficultyPreset {
  const { kps, accuracy } = stats

  // KPSと正確率に基づいて難易度を判定
  // 正確率が低い場合は、難易度を下げる
  if (accuracy < 60) {
    return 'easy'
  }

  // KPSが低い場合（初心者）
  if (kps < 2.0) {
    return 'easy'
  }

  // KPSが中程度の場合
  if (kps < 4.0) {
    // 正確率が高い場合は normal、低い場合は easy
    return accuracy >= 80 ? 'normal' : 'easy'
  }

  // KPSが高い場合
  if (kps < 6.0) {
    // 正確率に応じて normal または hard
    return accuracy >= 85 ? 'hard' : 'normal'
  }

  // KPSが非常に高い場合
  if (kps < 8.0) {
    // 正確率に応じて hard または expert
    return accuracy >= 90 ? 'expert' : 'hard'
  }

  // 超上級者
  return 'expert'
}

/**
 * スキルチェック結果の説明を生成
 */
export function getSkillCheckDescription(
  stats: GameStats,
  recommendedDifficulty: DifficultyPreset,
  isJapanese: boolean
): string {
  const { kps, accuracy } = stats

  if (isJapanese) {
    if (recommendedDifficulty === 'easy') {
      return `現在のスキル: KPS ${kps.toFixed(1)}, 正確率 ${accuracy}%\n「やさしい」難易度がおすすめです。`
    } else if (recommendedDifficulty === 'normal') {
      return `現在のスキル: KPS ${kps.toFixed(1)}, 正確率 ${accuracy}%\n「ふつう」難易度がおすすめです。`
    } else if (recommendedDifficulty === 'hard') {
      return `現在のスキル: KPS ${kps.toFixed(1)}, 正確率 ${accuracy}%\n「むずかしい」難易度がおすすめです。`
    } else {
      return `現在のスキル: KPS ${kps.toFixed(1)}, 正確率 ${accuracy}%\n「エキスパート」難易度がおすすめです。`
    }
  } else {
    if (recommendedDifficulty === 'easy') {
      return `Current skill: ${kps.toFixed(1)} KPS, ${accuracy}% accuracy\n"Easy" difficulty is recommended.`
    } else if (recommendedDifficulty === 'normal') {
      return `Current skill: ${kps.toFixed(1)} KPS, ${accuracy}% accuracy\n"Normal" difficulty is recommended.`
    } else if (recommendedDifficulty === 'hard') {
      return `Current skill: ${kps.toFixed(1)} KPS, ${accuracy}% accuracy\n"Hard" difficulty is recommended.`
    } else {
      return `Current skill: ${kps.toFixed(1)} KPS, ${accuracy}% accuracy\n"Expert" difficulty is recommended.`
    }
  }
}
