/**
 * SRS (Spaced Repetition System) ユーティリティ
 * エビングハウスの忘却曲線に基づいた間隔反復システム
 */

// 習熟度レベルに応じた基本間隔（時間単位）
// Level 0: 即座, Level 1: 1時間, Level 2: 6時間, Level 3: 1日, Level 4: 3日, Level 5: 1週間, Level 6: 2週間
const BASE_INTERVALS_HOURS = [0, 1, 6, 24, 72, 168, 336]

// 最大習熟度レベル
export const MAX_MASTERY_LEVEL = 5

// 最小サンプル数（弱点計算用）
export const MIN_SAMPLE_COUNT = 3

/**
 * 習熟度レベルに基づく次回復習間隔（ミリ秒）を計算
 */
export function calculateNextInterval(masteryLevel: number): number {
  const level = Math.max(0, Math.min(masteryLevel, MAX_MASTERY_LEVEL))
  const hours = BASE_INTERVALS_HOURS[level + 1] || BASE_INTERVALS_HOURS[BASE_INTERVALS_HOURS.length - 1]
  return hours * 60 * 60 * 1000  // ミリ秒に変換
}

/**
 * 次回復習時刻を計算
 */
export function calculateNextReviewAt(masteryLevel: number, currentTime: number = Date.now()): number {
  return currentTime + calculateNextInterval(masteryLevel)
}

/**
 * 正解/不正解に基づいて習熟度レベルを更新
 */
export function updateMasteryLevel(
  currentLevel: number,
  wasCorrect: boolean,
  consecutiveCorrect: number
): { newLevel: number; newConsecutiveCorrect: number } {
  if (wasCorrect) {
    const newConsecutiveCorrect = consecutiveCorrect + 1
    // 連続正解数が一定以上でレベルアップ（急激なレベルアップを防止）
    const shouldLevelUp = newConsecutiveCorrect >= 2 || currentLevel === 0
    const newLevel = shouldLevelUp 
      ? Math.min(currentLevel + 1, MAX_MASTERY_LEVEL)
      : currentLevel
    
    return {
      newLevel,
      newConsecutiveCorrect: shouldLevelUp ? 0 : newConsecutiveCorrect,
    }
  } else {
    // 不正解: レベルを2段階下げる（最低0）
    return {
      newLevel: Math.max(currentLevel - 2, 0),
      newConsecutiveCorrect: 0,
    }
  }
}

/**
 * 時間経過スコアを計算（0.0 〜 1.0）
 * 復習タイミングに近いほどスコアが高い
 */
export function calculateTimeDecayScore(
  lastPlayed: number,
  masteryLevel: number,
  currentTime: number = Date.now()
): number {
  if (lastPlayed === 0) {
    // 未練習の単語は最優先
    return 1.0
  }

  const interval = calculateNextInterval(masteryLevel)
  const elapsed = currentTime - lastPlayed
  const ratio = elapsed / interval

  if (ratio < 0.5) {
    // まだ復習には早い
    return 0.1 + ratio * 0.2
  } else if (ratio < 1.0) {
    // 復習タイミングが近づいている
    return 0.3 + (ratio - 0.5) * 1.4  // 0.3 → 1.0
  } else if (ratio < 2.0) {
    // 復習タイミング（最適）
    return 1.0
  } else {
    // 復習タイミングを大幅に過ぎている（忘却リスク高）
    return 0.8
  }
}

/**
 * 新規度スコアを計算（0.0 〜 1.0）
 * 練習回数が少ないほどスコアが高い
 */
export function calculateNoveltyScore(totalAttempts: number): number {
  if (totalAttempts === 0) {
    // 未練習の単語は最高優先度
    return 1.0
  } else if (totalAttempts < 3) {
    // 練習回数が少ない単語も優先
    return 0.8 - (totalAttempts * 0.15)
  } else if (totalAttempts < 10) {
    // まだ十分な練習量ではない
    return 0.4 - (totalAttempts * 0.03)
  }
  
  return 0.1
}

/**
 * 単語の難易度を計算（0.0 〜 1.0）
 */
export function calculateWordDifficulty(
  romaji: string,
  weakKeys: Set<string>,
  weakTransitions: Set<string>
): number {
  const normalizedRomaji = romaji.toLowerCase()
  let difficulty = 0

  // 長さによる難易度（15文字以上で最大0.3）
  difficulty += Math.min(normalizedRomaji.length / 15, 0.3)

  // 苦手キーの含有率
  let weakKeyCount = 0
  for (const char of normalizedRomaji) {
    if (weakKeys.has(char)) {
      weakKeyCount++
    }
  }
  difficulty += (weakKeyCount / normalizedRomaji.length) * 0.35

  // 苦手遷移の含有率
  let weakTransitionCount = 0
  for (let i = 1; i < normalizedRomaji.length; i++) {
    const transition = `${normalizedRomaji[i - 1]}->${normalizedRomaji[i]}`
    if (weakTransitions.has(transition)) {
      weakTransitionCount++
    }
  }
  if (normalizedRomaji.length > 1) {
    difficulty += (weakTransitionCount / (normalizedRomaji.length - 1)) * 0.35
  }

  return Math.min(difficulty, 1.0)
}

/**
 * ウォームアップブーストを適用（セッション開始時は易しい単語を優先）
 */
export function applyWarmupBoost(
  wordIndex: number,
  totalWords: number,
  wordDifficulty: number
): number {
  const warmupRatio = 0.15  // 最初の15%はウォームアップ
  const warmupEnd = Math.ceil(totalWords * warmupRatio)

  if (wordIndex < warmupEnd) {
    // ウォームアップ中は易しい単語を優先
    const progress = wordIndex / warmupEnd
    return wordDifficulty < 0.4 ? 1.0 - progress * 0.5 : 0.3
  }

  return 0.5  // 通常
}

/**
 * 重複ペナルティを適用（直近で出題された単語は除外）
 */
export function applyDuplicationPenalty(
  wordId: string,
  recentWordIds: string[],
  sessionWordIds: Set<string>
): number {
  // 直近で出題された単語は出題しない
  if (recentWordIds.includes(wordId)) {
    return 0.0
  }

  // セッション内で既出の単語は軽いペナルティ
  if (sessionWordIds.has(wordId)) {
    return 0.7
  }

  return 1.0
}

/**
 * アダプティブ難易度調整
 * 直近のパフォーマンスに基づいて難易度を調整
 */
export function calculateDifficultyAdjustment(
  recentCorrectRate: number,
  wordDifficulty: number
): number {
  if (recentCorrectRate > 0.9) {
    // 調子が良い → 難しい単語を優先
    return wordDifficulty > 0.5 ? 0.8 : 0.3
  } else if (recentCorrectRate < 0.5) {
    // 調子が悪い → 易しい単語を優先
    return wordDifficulty < 0.4 ? 0.8 : 0.3
  }

  // 通常: バランスよく
  return 0.5
}

/**
 * 練習モードに応じた重み配分を取得
 */
export type PracticeModeWeights = {
  weakness: number
  timeDecay: number
  novelty: number
  difficultyAdjust: number
  random: number
}

export function getWeightsForPracticeMode(mode: string): PracticeModeWeights {
  switch (mode) {
    case 'weakness-focus':
      // 弱点強化: 正確率が低い単語を優先し、ランダム順で出題
      // 正確率（accuracy）ベースで選択し、順序はランダム
      return {
        weakness: 0.85,  // 正確率ベースの弱点スコアを最重視
        timeDecay: 0.0,
        novelty: 0.0,
        difficultyAdjust: 0.0,
        random: 0.15,    // ランダム性を追加して順序をシャッフル
      }
    case 'review':
      // 復習優先: SRSに基づいて復習が必要な単語を優先
      return {
        weakness: 0.0,
        timeDecay: 0.90,  // SRSのタイムディケイを最重視
        novelty: 0.0,
        difficultyAdjust: 0.0,
        random: 0.10,
      }
    case 'random':
    default:
      // ランダム: 完全にランダムに出題
      return {
        weakness: 0.0,
        timeDecay: 0.0,
        novelty: 0.0,
        difficultyAdjust: 0.0,
        random: 1.0,
      }
  }
}

