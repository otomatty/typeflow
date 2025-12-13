import { useCallback, useEffect, useState, useRef } from 'react'
import { getAggregatedStats, saveAggregatedStats, resetAggregatedStats, AggregatedStatsRecord, getAllGameScores, saveGameScore, resetGameScores, GameScoreRecord } from '@/lib/db'
import type { KeystrokeRecord, KeyStats, KeyTransitionStats, Word, GameStats, GameSessionState, ScoringContext, WordScore, PracticeMode } from '@/lib/types'
import {
  MIN_SAMPLE_COUNT,
  calculateTimeDecayScore,
  calculateNoveltyScore,
  calculateWordDifficulty,
  calculateDifficultyAdjustment,
  applyWarmupBoost,
  applyDuplicationPenalty,
  getWeightsForPracticeMode,
} from '@/lib/srs-utils'

// 計算済みの弱点情報
export interface WeaknessInfo {
  weakTransitions: Array<KeyTransitionStats & { errorRate: number; avgLatency: number }>
  weakKeys: Array<KeyStats & { errorRate: number; avgLatency: number }>
}

// 直近の結果を保持する数
const RECENT_RESULTS_COUNT = 10
const RECENT_WORDS_COUNT = 5

export function useTypingAnalytics() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStatsRecord | undefined>(undefined)
  const [gameScores, setGameScores] = useState<GameScoreRecord[]>([])
  
  // ゲームセッション状態
  const sessionStateRef = useRef<GameSessionState>({
    wordsPlayed: 0,
    recentResults: [],
    recentWordIds: [],
    sessionWordIds: new Set(),
    startedAt: Date.now(),
  })

  // データを取得
  const fetchStats = useCallback(async () => {
    try {
      const stats = await getAggregatedStats()
      setAggregatedStats(stats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [])

  // スコア履歴を取得
  const fetchGameScores = useCallback(async () => {
    try {
      const scores = await getAllGameScores()
      setGameScores(scores)
    } catch (error) {
      console.error('Failed to fetch game scores:', error)
    }
  }, [])

  // Initialize stats and scores
  useEffect(() => {
    async function init() {
      await Promise.all([fetchStats(), fetchGameScores()])
      setIsInitialized(true)
    }
    init()
  }, [fetchStats, fetchGameScores])

  // キーストローク記録からの統計更新
  const updateStats = useCallback(async (keystrokes: KeystrokeRecord[]) => {
    if (keystrokes.length === 0) return

    const current = await getAggregatedStats()
    const keyStats: Record<string, KeyStats> = current?.keyStats ? { ...current.keyStats } : {}
    const transitionStats: Record<string, KeyTransitionStats> = current?.transitionStats ? { ...current.transitionStats } : {}

    for (const keystroke of keystrokes) {
      const { key, actualKey, isCorrect, latency, previousKey } = keystroke

      // キー単体の統計を更新
      if (!keyStats[key]) {
        keyStats[key] = {
          key,
          totalCount: 0,
          errorCount: 0,
          totalLatency: 0,
          confusedWith: {},
        }
      }
      keyStats[key].totalCount++
      keyStats[key].totalLatency += latency

      if (!isCorrect) {
        keyStats[key].errorCount++
        // 混同キーを記録
        if (!keyStats[key].confusedWith[actualKey]) {
          keyStats[key].confusedWith[actualKey] = 0
        }
        keyStats[key].confusedWith[actualKey]++
      }

      // キー遷移の統計を更新（前のキーがある場合のみ）
      if (previousKey !== null) {
        const transitionKey = `${previousKey}->${key}`
        if (!transitionStats[transitionKey]) {
          transitionStats[transitionKey] = {
            fromKey: previousKey,
            toKey: key,
            totalCount: 0,
            errorCount: 0,
            totalLatency: 0,
          }
        }
        transitionStats[transitionKey].totalCount++
        transitionStats[transitionKey].totalLatency += latency
        
        if (!isCorrect) {
          transitionStats[transitionKey].errorCount++
        }
      }
    }

    await saveAggregatedStats({
      keyStats,
      transitionStats,
      lastUpdated: Date.now(),
    })

    // ローカル状態も更新
    setAggregatedStats({
      id: 1,
      keyStats,
      transitionStats,
      lastUpdated: Date.now(),
    })
  }, [])

  // 弱点を計算
  const calculateWeaknesses = useCallback((): WeaknessInfo => {
    if (!aggregatedStats) {
      return { weakTransitions: [], weakKeys: [] }
    }

    // 弱点トランジションを計算
    const weakTransitions = Object.values(aggregatedStats.transitionStats)
      .filter(t => t.totalCount >= MIN_SAMPLE_COUNT)
      .map(t => ({
        ...t,
        errorRate: t.errorCount / t.totalCount,
        avgLatency: t.totalLatency / t.totalCount,
      }))
      .sort((a, b) => {
        // 複合スコア: ミス率60% + 正規化された遅延40%
        const scoreA = a.errorRate * 0.6 + Math.min(a.avgLatency / 500, 1) * 0.4
        const scoreB = b.errorRate * 0.6 + Math.min(b.avgLatency / 500, 1) * 0.4
        return scoreB - scoreA
      })
      .slice(0, 20) // Top 20

    // 弱点キーを計算
    const weakKeys = Object.values(aggregatedStats.keyStats)
      .filter(k => k.totalCount >= MIN_SAMPLE_COUNT)
      .map(k => ({
        ...k,
        errorRate: k.errorCount / k.totalCount,
        avgLatency: k.totalLatency / k.totalCount,
      }))
      .sort((a, b) => {
        const scoreA = a.errorRate * 0.6 + Math.min(a.avgLatency / 500, 1) * 0.4
        const scoreB = b.errorRate * 0.6 + Math.min(b.avgLatency / 500, 1) * 0.4
        return scoreB - scoreA
      })
      .slice(0, 15) // Top 15

    return { weakTransitions, weakKeys }
  }, [aggregatedStats])

  // セッション状態をリセット
  const resetSessionState = useCallback(() => {
    sessionStateRef.current = {
      wordsPlayed: 0,
      recentResults: [],
      recentWordIds: [],
      sessionWordIds: new Set(),
      startedAt: Date.now(),
    }
  }, [])

  // セッション状態を更新（単語完了時に呼び出す）
  const updateSessionState = useCallback((wordId: string, wasCorrect: boolean) => {
    const session = sessionStateRef.current
    
    // 結果を追加
    session.recentResults.push(wasCorrect)
    if (session.recentResults.length > RECENT_RESULTS_COUNT) {
      session.recentResults.shift()
    }
    
    // 単語IDを追加
    session.recentWordIds.push(wordId)
    if (session.recentWordIds.length > RECENT_WORDS_COUNT) {
      session.recentWordIds.shift()
    }
    
    session.sessionWordIds.add(wordId)
    session.wordsPlayed++
  }, [])

  // 直近の正答率を計算
  const getRecentCorrectRate = useCallback((): number => {
    const results = sessionStateRef.current.recentResults
    if (results.length === 0) return 0.75  // デフォルト
    return results.filter(r => r).length / results.length
  }, [])

  // スコアリングコンテキストを構築
  const buildScoringContext = useCallback((
    practiceMode: PracticeMode = 'balanced',
    srsEnabled: boolean = true,
    warmupEnabled: boolean = true
  ): ScoringContext => {
    const { weakTransitions, weakKeys } = calculateWeaknesses()
    
    const weakKeySet = new Set(weakKeys.map(k => k.key))
    const weakTransitionSet = new Set(weakTransitions.map(t => `${t.fromKey}->${t.toKey}`))
    
    const weakKeyScores = new Map(
      weakKeys.map(k => [k.key, k.errorRate + Math.min(k.avgLatency / 500, 1)])
    )
    const weakTransitionScores = new Map(
      weakTransitions.map(t => [`${t.fromKey}->${t.toKey}`, t.errorRate + Math.min(t.avgLatency / 500, 1)])
    )
    
    return {
      weakKeys: weakKeySet,
      weakTransitions: weakTransitionSet,
      weakKeyScores,
      weakTransitionScores,
      recentCorrectRate: getRecentCorrectRate(),
      practiceMode,
      srsEnabled,
      warmupEnabled,
    }
  }, [calculateWeaknesses, getRecentCorrectRate])

  // 単語の弱点スコアを計算（正規化: 0.0 〜 1.0）
  const calculateWeaknessScore = useCallback((
    word: Word,
    context: ScoringContext
  ): number => {
    const romaji = word.romaji.toLowerCase()
    let rawScore = 0
    let maxPossibleScore = 0

    // キー遷移チェック
    for (let i = 1; i < romaji.length; i++) {
      const transition = `${romaji[i - 1]}->${romaji[i]}`
      const transitionScore = context.weakTransitionScores.get(transition)
      if (transitionScore !== undefined) {
        rawScore += transitionScore * 2
      }
      maxPossibleScore += 2 * 2  // 最大スコア
    }

    // 弱点キーチェック
    for (const char of romaji) {
      const keyScore = context.weakKeyScores.get(char)
      if (keyScore !== undefined) {
        rawScore += keyScore
      }
      maxPossibleScore += 2  // 最大スコア
    }

    // 既存の単語精度も考慮（精度が低いほどスコアが高い）
    rawScore += (1 - word.stats.accuracy / 100) * 3
    maxPossibleScore += 3

    // 正規化
    if (maxPossibleScore === 0) return 0
    return Math.min(rawScore / maxPossibleScore, 1.0)
  }, [])

  // 単語の総合スコアを計算
  const calculateWordScore = useCallback((
    word: Word,
    context: ScoringContext,
    wordIndex: number,
    totalWords: number
  ): WordScore => {
    const weights = getWeightsForPracticeMode(context.practiceMode)
    const session = sessionStateRef.current

    // 各スコアを計算
    const weaknessScore = calculateWeaknessScore(word, context)
    
    const timeDecayScore = context.srsEnabled
      ? calculateTimeDecayScore(word.stats.lastPlayed, word.stats.masteryLevel)
      : 0.5
    
    const totalAttempts = word.stats.correct + word.stats.miss
    const noveltyScore = calculateNoveltyScore(totalAttempts)
    
    const wordDifficulty = calculateWordDifficulty(
      word.romaji,
      context.weakKeys,
      context.weakTransitions
    )
    
    const difficultyAdjustScore = calculateDifficultyAdjustment(
      context.recentCorrectRate,
      wordDifficulty
    )
    
    const randomScore = Math.random()

    // 重み付け合計を計算
    const breakdown = {
      weakness: weaknessScore,
      timeDecay: timeDecayScore,
      novelty: noveltyScore,
      difficultyAdjust: difficultyAdjustScore,
      random: randomScore,
    }

    let totalScore = 
      breakdown.weakness * weights.weakness +
      breakdown.timeDecay * weights.timeDecay +
      breakdown.novelty * weights.novelty +
      breakdown.difficultyAdjust * weights.difficultyAdjust +
      breakdown.random * weights.random

    // ウォームアップブースト適用
    if (context.warmupEnabled) {
      const warmupMultiplier = applyWarmupBoost(wordIndex, totalWords, wordDifficulty)
      totalScore *= warmupMultiplier
    }

    // 重複ペナルティ適用
    const duplicationMultiplier = applyDuplicationPenalty(
      word.id,
      session.recentWordIds,
      session.sessionWordIds
    )
    totalScore *= duplicationMultiplier

    return {
      wordId: word.id,
      totalScore,
      breakdown,
    }
  }, [calculateWeaknessScore])

  // 新しいマルチファクター・スコアリングで単語を選択
  const selectWordsWithScoring = useCallback((
    words: Word[],
    context: ScoringContext
  ): Word[] => {
    if (words.length === 0) return []

    // ランダムモードの場合は単純にシャッフル
    if (context.practiceMode === 'random') {
      return [...words].sort(() => Math.random() - 0.5)
    }

    // 弱点強化モード: 正確率が低い単語を上位から選択し、ランダム順で出題
    if (context.practiceMode === 'weakness-focus') {
      // 正確率でソート（低い順）
      const sortedByAccuracy = [...words].sort((a, b) => {
        // 練習回数が少ない単語は優先度を下げる
        const aAttempts = a.stats.correct + a.stats.miss
        const bAttempts = b.stats.correct + b.stats.miss
        
        // 練習回数が0の単語は最後に
        if (aAttempts === 0 && bAttempts > 0) return 1
        if (bAttempts === 0 && aAttempts > 0) return -1
        if (aAttempts === 0 && bAttempts === 0) return Math.random() - 0.5
        
        // 正確率が低い順
        return a.stats.accuracy - b.stats.accuracy
      })
      
      // 正確率が低い順にソートした後、全体をランダムにシャッフル
      // ただし、正確率が低いグループを優先的に出題するため、
      // 上位30%をランダムにシャッフルして先頭に配置
      const topCount = Math.max(Math.ceil(sortedByAccuracy.length * 0.3), 5)
      const topWords = sortedByAccuracy.slice(0, topCount)
      const restWords = sortedByAccuracy.slice(topCount)
      
      // 両グループをそれぞれシャッフル
      for (let i = topWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[topWords[i], topWords[j]] = [topWords[j], topWords[i]]
      }
      for (let i = restWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[restWords[i], restWords[j]] = [restWords[j], restWords[i]]
      }
      
      return [...topWords, ...restWords]
    }

    // 復習優先モード: SRSに基づいて復習が必要な単語を優先
    if (context.practiceMode === 'review') {
      const now = Date.now()
      
      // 復習時期でソート（期限が近い/過ぎている順）
      const sortedByReview = [...words].sort((a, b) => {
        // 未練習の単語は優先度を下げる
        if (a.stats.lastPlayed === 0 && b.stats.lastPlayed > 0) return 1
        if (b.stats.lastPlayed === 0 && a.stats.lastPlayed > 0) return -1
        if (a.stats.lastPlayed === 0 && b.stats.lastPlayed === 0) return Math.random() - 0.5
        
        // 次回復習時刻が早い順（過ぎているものが最優先）
        const aOverdue = now - a.stats.nextReviewAt
        const bOverdue = now - b.stats.nextReviewAt
        return bOverdue - aOverdue
      })
      
      // 復習が必要な単語をランダム順で出題
      const overdueWords = sortedByReview.filter(w => w.stats.nextReviewAt <= now && w.stats.lastPlayed > 0)
      const futureWords = sortedByReview.filter(w => w.stats.nextReviewAt > now || w.stats.lastPlayed === 0)
      
      // overdueをシャッフル
      for (let i = overdueWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[overdueWords[i], overdueWords[j]] = [overdueWords[j], overdueWords[i]]
      }
      // futureもシャッフル
      for (let i = futureWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[futureWords[i], futureWords[j]] = [futureWords[j], futureWords[i]]
      }
      
      return [...overdueWords, ...futureWords]
    }

    // デフォルト（ランダム）
    return [...words].sort(() => Math.random() - 0.5)
  }, [calculateWordScore])

  // 弱点に基づいて単語をソート（後方互換性のため維持、内部で新しいロジックを使用）
  const selectWeaknessBasedWords = useCallback((
    words: Word[],
    options?: { 
      weaknessWeight?: number
      randomWeight?: number 
      practiceMode?: PracticeMode
      srsEnabled?: boolean
      warmupEnabled?: boolean
    }
  ): Word[] => {
    const {
      practiceMode = 'balanced',
      srsEnabled = true,
      warmupEnabled = true,
    } = options || {}

    const context = buildScoringContext(practiceMode, srsEnabled, warmupEnabled)
    return selectWordsWithScoring(words, context)
  }, [buildScoringContext, selectWordsWithScoring])

  // ゲームスコアを保存
  const saveScore = useCallback(async (stats: GameStats) => {
    try {
      await saveGameScore({
        kps: stats.kps,
        totalKeystrokes: stats.totalKeystrokes,
        accuracy: stats.accuracy,
        correctWords: stats.correctWords,
        perfectWords: stats.perfectWords,
        totalWords: stats.totalWords,
        totalTime: stats.totalTime,
      })
      await fetchGameScores()
    } catch (error) {
      console.error('Failed to save game score:', error)
    }
  }, [fetchGameScores])

  // 統計をリセット
  const resetStats = useCallback(async () => {
    await Promise.all([resetAggregatedStats(), resetGameScores()])
    setAggregatedStats(undefined)
    setGameScores([])
  }, [])

  return {
    isInitialized,
    aggregatedStats,
    gameScores,
    updateStats,
    saveScore,
    calculateWeaknesses,
    selectWeaknessBasedWords,
    resetStats,
    // 新しいセッション管理API
    resetSessionState,
    updateSessionState,
    getRecentCorrectRate,
    buildScoringContext,
    selectWordsWithScoring,
  }
}
