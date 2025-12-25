import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Word,
  WordPracticeState,
  WordPracticePhase,
  WordPracticeStats,
  WordPracticeAttempt,
  AppSettings,
} from '@/lib/types'
import { GameScoreRecord } from '@/lib/db'
import { validateRomajiInput, getMatchingVariation, normalizeRomaji } from '@/lib/romaji-utils'
import { calculateWordTimeLimit } from '@/lib/adaptive-time-utils'

// 各フェーズの目標連続成功数
const PHASE_TARGETS: Record<WordPracticePhase, number> = {
  accuracy: 3, // Phase 1: 連続3回成功
  speed: 3, // Phase 2: 連続3回成功（時間制限あり）
  mastery: 5, // Phase 3: 連続5回成功（厳しい時間制限）
}

// 速度フェーズの初期時間制限（秒）- 余裕のある設定
const SPEED_PHASE_INITIAL_TIME = 10

// 速度フェーズの時間短縮率
const SPEED_PHASE_TIME_REDUCTION = 0.9 // 成功ごとに10%短縮

// マスターフェーズの時間倍率（通常のゲームモードの制限時間に対して）
// 連続5回成功する必要があるため、余裕を持たせる
const MASTERY_PHASE_TIME_MULTIPLIER = 1.5 // 通常の1.5倍の時間を確保

interface UseWordPracticeProps {
  onComplete?: (word: Word, stats: WordPracticeStats) => void
  updateWordStats?: (wordId: string, correct: boolean) => void
  onExit?: () => void
  gameScores?: GameScoreRecord[]
  settings?: AppSettings
}

export function useWordPractice({
  onComplete,
  updateWordStats,
  onExit,
  gameScores = [],
  settings,
}: UseWordPracticeProps = {}) {
  const [state, setState] = useState<WordPracticeState>({
    word: null,
    phase: 'accuracy',
    currentInput: '',
    consecutiveSuccess: 0,
    targetConsecutive: PHASE_TARGETS.accuracy,
    attemptCount: 0,
    currentMissCount: 0,
    isActive: false,
    attemptStartTime: null,
    timeLimit: null,
    timeRemaining: null,
  })

  const [stats, setStats] = useState<WordPracticeStats>({
    totalAttempts: 0,
    successCount: 0,
    bestTime: null,
    averageTime: null,
    attempts: [],
  })

  const [showError, setShowError] = useState(false)

  // タイマー用のref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 練習を開始
  const startPractice = useCallback((word: Word) => {
    setState({
      word,
      phase: 'accuracy',
      currentInput: '',
      consecutiveSuccess: 0,
      targetConsecutive: PHASE_TARGETS.accuracy,
      attemptCount: 0,
      currentMissCount: 0,
      isActive: true,
      attemptStartTime: Date.now(),
      timeLimit: null,
      timeRemaining: null,
    })
    setStats({
      totalAttempts: 0,
      successCount: 0,
      bestTime: null,
      averageTime: null,
      attempts: [],
    })
  }, [])

  // 練習を終了
  const endPractice = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (state.word && onComplete) {
      onComplete(state.word, stats)
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      word: null,
    }))
  }, [state.word, stats, onComplete])

  // 次のフェーズに進む
  const advanceToNextPhase = useCallback(() => {
    setState(prev => {
      const nextPhase: WordPracticePhase =
        prev.phase === 'accuracy' ? 'speed' : prev.phase === 'speed' ? 'mastery' : 'mastery'

      // 既にマスターフェーズなら完了
      if (prev.phase === 'mastery') {
        return prev
      }

      let timeLimit: number | null = null

      if (nextPhase === 'speed') {
        timeLimit = SPEED_PHASE_INITIAL_TIME
      } else if (nextPhase === 'mastery') {
        // マスターフェーズでは通常のゲームモードと同じロジックで制限時間を計算
        // ただし、連続5回成功する必要があるため、時間に余裕を持たせる
        if (prev.word && settings && gameScores) {
          const baseTimeLimit = calculateWordTimeLimit(prev.word, gameScores, {
            targetKpsMultiplier: settings.targetKpsMultiplier,
            comfortZoneRatio: settings.comfortZoneRatio,
            minTimeLimit: settings.minTimeLimit,
            maxTimeLimit: settings.maxTimeLimit,
            minTimeLimitByDifficulty: settings.minTimeLimitByDifficulty,
          })
          // マスターフェーズでは通常の1.5倍の時間を確保（連続5回成功のため）
          timeLimit = Math.min(baseTimeLimit * MASTERY_PHASE_TIME_MULTIPLIER, settings.maxTimeLimit)
        } else {
          // フォールバック: 設定がない場合はデフォルト値を使用
          timeLimit = 5
        }
      }

      return {
        ...prev,
        phase: nextPhase,
        consecutiveSuccess: 0,
        targetConsecutive: PHASE_TARGETS[nextPhase],
        currentInput: '',
        currentMissCount: 0,
        attemptStartTime: Date.now(),
        timeLimit,
        timeRemaining: timeLimit,
      }
    })
  }, [gameScores, settings])

  // 試行を完了（成功）
  const completeAttempt = useCallback(
    (completionTime: number) => {
      const attempt: WordPracticeAttempt = {
        success: true,
        completionTime,
        missCount: 0,
        timedOut: false,
      }

      setStats(prev => {
        const newAttempts = [...prev.attempts, attempt]
        const successAttempts = newAttempts.filter(a => a.success)
        const totalTime = successAttempts.reduce((sum, a) => sum + a.completionTime, 0)

        return {
          totalAttempts: prev.totalAttempts + 1,
          successCount: prev.successCount + 1,
          bestTime:
            prev.bestTime === null ? completionTime : Math.min(prev.bestTime, completionTime),
          averageTime: successAttempts.length > 0 ? totalTime / successAttempts.length : null,
          attempts: newAttempts,
        }
      })

      // 単語の統計を更新
      if (updateWordStats && state.word) {
        updateWordStats(state.word.id, true)
      }

      setState(prev => {
        const newConsecutive = prev.consecutiveSuccess + 1

        // 目標達成チェック
        if (newConsecutive >= prev.targetConsecutive) {
          // マスターフェーズ完了
          if (prev.phase === 'mastery') {
            return {
              ...prev,
              consecutiveSuccess: newConsecutive,
              attemptCount: prev.attemptCount + 1,
              currentInput: '',
              currentMissCount: 0,
              isActive: false, // 完了
            }
          }
          // 次のフェーズに進む準備
          return {
            ...prev,
            consecutiveSuccess: newConsecutive,
            attemptCount: prev.attemptCount + 1,
          }
        }

        // 速度フェーズでは成功ごとに時間制限を短縮
        let newTimeLimit = prev.timeLimit
        if (prev.phase === 'speed' && prev.timeLimit) {
          newTimeLimit = Math.max(3, prev.timeLimit * SPEED_PHASE_TIME_REDUCTION)
        }

        return {
          ...prev,
          consecutiveSuccess: newConsecutive,
          attemptCount: prev.attemptCount + 1,
          currentInput: '',
          currentMissCount: 0,
          attemptStartTime: Date.now(),
          timeLimit: newTimeLimit,
          timeRemaining: newTimeLimit,
        }
      })
    },
    [state.word, updateWordStats]
  )

  // 試行を失敗（ミスまたはタイムアウト）
  const failAttempt = useCallback(
    (timedOut: boolean = false) => {
      const attempt: WordPracticeAttempt = {
        success: false,
        completionTime: state.attemptStartTime ? Date.now() - state.attemptStartTime : 0,
        missCount: state.currentMissCount,
        timedOut,
      }

      setStats(prev => ({
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
        attempts: [...prev.attempts, attempt],
      }))

      // 単語の統計を更新
      if (updateWordStats && state.word) {
        updateWordStats(state.word.id, false)
      }

      // 速度フェーズでタイムアウトした場合、時間制限を少し緩める
      let newTimeLimit = state.timeLimit
      if (state.phase === 'speed' && timedOut && state.timeLimit) {
        newTimeLimit = Math.min(SPEED_PHASE_INITIAL_TIME, state.timeLimit * 1.2)
      }

      setState(prev => ({
        ...prev,
        consecutiveSuccess: 0, // リセット
        attemptCount: prev.attemptCount + 1,
        currentInput: '',
        currentMissCount: 0,
        attemptStartTime: Date.now(),
        timeLimit: newTimeLimit,
        timeRemaining: newTimeLimit,
      }))
    },
    [
      state.attemptStartTime,
      state.currentMissCount,
      state.phase,
      state.timeLimit,
      state.word,
      updateWordStats,
    ]
  )

  // キー入力を処理
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!state.isActive || !state.word) return

      // Escapeで終了
      if (e.key === 'Escape') {
        endPractice()
        if (onExit) {
          onExit()
        }
        return
      }

      // Backspace
      if (e.key === 'Backspace') {
        setState(prev => ({
          ...prev,
          currentInput: prev.currentInput.slice(0, -1),
        }))
        return
      }

      // 文字入力
      if (e.key.length === 1 && /[a-zA-Z0-9.\-_?!,;:'"]/.test(e.key)) {
        e.preventDefault()

        const newInput = state.currentInput + e.key.toLowerCase()

        // バリデーション
        const prevValidation = validateRomajiInput(state.word.romaji, state.currentInput)
        const newValidation = validateRomajiInput(state.word.romaji, newInput)

        // 進捗が増えなかった場合はミス
        if (newValidation.progress <= prevValidation.progress && !newValidation.isCorrect) {
          setShowError(true)
          setTimeout(() => setShowError(false), 200)

          setState(prev => ({
            ...prev,
            currentMissCount: prev.currentMissCount + 1,
          }))

          // accuracyフェーズ以外ではミスで失敗
          if (state.phase !== 'accuracy') {
            failAttempt(false)
          }
          return
        }

        // 入力を更新
        setState(prev => ({
          ...prev,
          currentInput: newInput,
        }))

        // 完了チェック
        if (newValidation.isCorrect) {
          const completionTime = state.attemptStartTime ? Date.now() - state.attemptStartTime : 0

          // ミスがあった場合は失敗
          if (state.currentMissCount > 0) {
            failAttempt(false)
          } else {
            completeAttempt(completionTime)
          }
        }
      }
    },
    [state, endPractice, failAttempt, completeAttempt]
  )

  // フェーズ進行のチェック
  useEffect(() => {
    if (
      state.isActive &&
      state.consecutiveSuccess >= state.targetConsecutive &&
      state.phase !== 'mastery'
    ) {
      advanceToNextPhase()
    }
  }, [
    state.consecutiveSuccess,
    state.targetConsecutive,
    state.phase,
    state.isActive,
    advanceToNextPhase,
  ])

  // マスターフェーズ完了時にコールバックを呼ぶ
  useEffect(() => {
    if (
      !state.isActive &&
      state.word &&
      state.phase === 'mastery' &&
      state.consecutiveSuccess >= PHASE_TARGETS.mastery
    ) {
      if (onComplete) {
        onComplete(state.word, stats)
      }
    }
  }, [state.isActive, state.word, state.phase, state.consecutiveSuccess, stats, onComplete])

  // タイマー管理
  useEffect(() => {
    if (state.isActive && state.timeLimit !== null && state.timeRemaining !== null) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeRemaining === null) return prev

          const newTimeRemaining = Math.max(0, prev.timeRemaining - 0.1)

          if (newTimeRemaining <= 0) {
            // タイムアウト
            return prev // failAttemptは別途呼ばれる
          }

          return {
            ...prev,
            timeRemaining: newTimeRemaining,
          }
        })
      }, 100)

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }
  }, [state.isActive, state.timeLimit !== null])

  // タイムアウトチェック
  useEffect(() => {
    if (state.isActive && state.timeRemaining !== null && state.timeRemaining <= 0) {
      failAttempt(true)
    }
  }, [state.timeRemaining, state.isActive, failAttempt])

  // キーボードイベント
  useEffect(() => {
    if (state.isActive) {
      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }
  }, [state.isActive, handleKeyPress])

  // 表示用のローマ字情報を計算
  const getDisplayInfo = useCallback(() => {
    if (!state.word) {
      return { inputPart: '', remainingPart: '' }
    }

    const matchingVariation = getMatchingVariation(state.word.romaji, state.currentInput)
    const displayRomaji = matchingVariation || normalizeRomaji(state.word.romaji)

    return {
      inputPart: state.currentInput,
      remainingPart: displayRomaji.slice(state.currentInput.length),
    }
  }, [state.word, state.currentInput])

  // 現在のフェーズが完了したかどうか
  const isPhaseComplete = state.consecutiveSuccess >= state.targetConsecutive

  // 全体が完了したかどうか
  const isComplete =
    !state.isActive &&
    state.phase === 'mastery' &&
    state.consecutiveSuccess >= PHASE_TARGETS.mastery

  return {
    state,
    stats,
    showError,
    startPractice,
    endPractice,
    getDisplayInfo,
    isPhaseComplete,
    isComplete,
  }
}
