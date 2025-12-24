import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Word,
  GameState,
  GameStats,
  KeystrokeRecord,
  AppSettings,
  DifficultyParams,
  WordPerformanceRecord,
  determineWordResult,
} from '@/lib/types'
import { validateRomajiInput, getMatchingVariation, normalizeRomaji } from '@/lib/romaji-utils'
import { calculateWordTimeLimit } from '@/lib/adaptive-time-utils'
import { calculateMissPenalty } from '@/lib/difficulty-presets'
import { GameScoreRecord } from '@/lib/db'
import { toast } from 'sonner'

export type ViewType =
  | 'menu'
  | 'words'
  | 'stats'
  | 'settings'
  | 'presets'
  | 'game'
  | 'gameover'
  | 'profile'
  | 'word-practice'

interface UseGameProps {
  words: Word[]
  updateWordStats: (wordId: string, correct: boolean) => void
  onSessionEnd?: (keystrokes: KeystrokeRecord[]) => void
  getGameWords?: () => Word[] // Returns words with settings applied (e.g., word count limit)
  // 制限時間計算用
  gameScores?: GameScoreRecord[]
  settings?: AppSettings
}

// 現在の単語のパフォーマンス追跡用（部分的なデータ）
interface CurrentWordPerformance {
  wordId: string
  wordText: string
  reading: string
  romaji: string
  startTime: number
  firstKeyExpected: string | null
  firstKeyActual: string | null
  firstKeyCorrect: boolean | null
  reactionTime: number | null
  keystrokeCount: number
  missCount: number
}

export function useGame({
  words,
  updateWordStats,
  onSessionEnd,
  getGameWords,
  gameScores = [],
  settings,
}: UseGameProps) {
  const [view, setView] = useState<ViewType>('menu')
  const [gameState, setGameState] = useState<GameState & { currentWordMissCount: number }>({
    isPlaying: false,
    currentWordIndex: 0,
    currentInput: '',
    timeRemaining: 10,
    totalTime: 10,
    words: [],
    mistakeWords: [],
    correctCount: 0,
    totalKeystrokes: 0,
    startTime: null,
    wordStartTime: null,
    currentWordMissCount: 0, // 現在の単語でのミス数（ペナルティ計算用）
  })
  const [showError, setShowError] = useState(false)
  const [gameStats, setGameStats] = useState<GameStats>({
    kps: 0,
    totalKeystrokes: 0,
    accuracy: 100,
    completedWords: 0,
    successfulWords: 0,
    failedWords: 0,
    totalWords: 0,
    totalTime: 0,
    avgReactionTime: 0,
    firstKeyAccuracy: 0,
    wordPerformances: [],
  })

  // キーストローク記録用
  const keystrokesRef = useRef<KeystrokeRecord[]>([])
  const lastKeystrokeTimeRef = useRef<number>(0)
  const previousKeyRef = useRef<string | null>(null)

  // 単語ごとのパフォーマンス記録用
  const wordPerformancesRef = useRef<WordPerformanceRecord[]>([])
  const currentWordPerformanceRef = useRef<CurrentWordPerformance | null>(null)

  // やり直しモード中かどうかを追跡
  const isRetryModeRef = useRef<boolean>(false)
  // やり直し開始時の mistakeWords を保存
  const retryStartMistakeWordsRef = useRef<string[]>([])
  // やり直しモード中に全ての単語を正解した場合、新しいゲームを開始するフラグ
  const shouldAutoStartNewGameRef = useRef<boolean>(false)

  const endGame = useCallback(
    (completed: boolean = false) => {
      const endTime = Date.now()
      const startTime = gameState.startTime || endTime
      const totalSeconds = (endTime - startTime) / 1000

      // タイムアウト時: 現在の単語のパフォーマンスを記録（未完了として）
      if (!completed && currentWordPerformanceRef.current) {
        const currentPerf = currentWordPerformanceRef.current
        const isCompleted = false
        const wordPerformance: WordPerformanceRecord = {
          wordId: currentPerf.wordId,
          wordText: currentPerf.wordText,
          reading: currentPerf.reading,
          romaji: currentPerf.romaji,
          firstKeyExpected: currentPerf.firstKeyExpected || '',
          firstKeyActual: currentPerf.firstKeyActual || '',
          firstKeyCorrect: currentPerf.firstKeyCorrect ?? false,
          reactionTime: currentPerf.reactionTime ?? 0,
          totalTime: endTime - currentPerf.startTime,
          keystrokeCount: currentPerf.keystrokeCount,
          missCount: currentPerf.missCount,
          completed: isCompleted,
          result: determineWordResult(isCompleted, currentPerf.missCount), // 時間切れは必ず失敗
        }
        wordPerformancesRef.current.push(wordPerformance)
      }

      // wordPerformancesから実際の統計を計算
      const performances = wordPerformancesRef.current
      // 実際にやった問題数 = wordPerformancesの数（タイムアウトした問題も含む）
      const totalAttempted = performances.length
      // 入力完了した単語数（時間切れでないもの）
      const completedWords = performances.filter(p => p.completed).length
      // 成功した単語数 = ミスなく完了（result === 'success'）
      const successfulWords = performances.filter(p => p.result === 'success').length
      // 失敗した単語数 = ミスありまたは時間切れ（result === 'failed'）
      const failedWords = performances.filter(p => p.result === 'failed').length
      // 失敗した単語のIDを抽出（復習用）
      const mistakeWordIds = performances.filter(p => p.result === 'failed').map(p => p.wordId)

      // mistakeWords を計算
      // やり直しモード中は、復習中に正解した問題を開始時の mistakeWords から除外
      // 時間切れでも正解した問題は再出題しない
      let finalMistakeWords: string[] = []
      if (isRetryModeRef.current) {
        // 復習中に正解した問題のIDを取得
        const successfulWordIds = performances
          .filter(p => p.result === 'success')
          .map(p => p.wordId)
        // 開始時の mistakeWords から正解した問題を除外し、今回失敗した問題を追加
        finalMistakeWords = [
          ...retryStartMistakeWordsRef.current.filter(id => !successfulWordIds.includes(id)),
          ...mistakeWordIds.filter(id => !retryStartMistakeWordsRef.current.includes(id)),
        ]
        // 重複を除去
        finalMistakeWords = [...new Set(finalMistakeWords)]
      } else {
        // 通常モードの場合は、wordPerformancesから抽出したmistakeWordIdsを使用
        finalMistakeWords = mistakeWordIds
      }

      // 復習モード中に全ての単語を成功したかどうかをwordPerformancesで判定
      const allWordsSuccessful =
        isRetryModeRef.current &&
        completed &&
        performances.length > 0 &&
        performances.every(p => p.result === 'success')

      // やり直しモード中に全ての単語を成功した場合、新しいゲームを自動的に開始
      const shouldStartNewGame = completed && isRetryModeRef.current && allWordsSuccessful

      // KPS = 総打鍵数 / 総時間（秒）
      const kps =
        totalSeconds > 0 ? Math.round((gameState.totalKeystrokes / totalSeconds) * 10) / 10 : 0

      // 正確率 = 成功ワード数 / 試行ワード数 * 100
      const accuracy =
        totalAttempted > 0 ? Math.round((successfulWords / totalAttempted) * 100) : 100

      // 初動統計を計算（performancesは既に上で取得済み）
      const performancesWithReaction = performances.filter(p => p.reactionTime > 0)
      const avgReactionTime =
        performancesWithReaction.length > 0
          ? Math.round(
              performancesWithReaction.reduce((sum, p) => sum + p.reactionTime, 0) /
                performancesWithReaction.length
            )
          : 0

      const performancesWithFirstKey = performances.filter(p => p.firstKeyExpected !== '')
      const firstKeyCorrectCount = performancesWithFirstKey.filter(p => p.firstKeyCorrect).length
      const firstKeyAccuracy =
        performancesWithFirstKey.length > 0
          ? Math.round((firstKeyCorrectCount / performancesWithFirstKey.length) * 100)
          : 100

      setGameStats({
        kps,
        totalKeystrokes: gameState.totalKeystrokes,
        accuracy,
        completedWords,
        successfulWords,
        failedWords,
        totalWords: gameState.words.length,
        totalTime: totalSeconds,
        avgReactionTime,
        firstKeyAccuracy,
        wordPerformances: [...performances],
      })

      // セッション終了時にキーストローク記録を渡す
      if (onSessionEnd && keystrokesRef.current.length > 0) {
        onSessionEnd(keystrokesRef.current)
      }

      setGameState(prev => ({
        ...prev,
        isPlaying: false,
        mistakeWords: finalMistakeWords, // 復元した mistakeWords を設定
      }))

      // やり直しモード中に全ての単語を正解した場合、新しいゲームを自動的に開始するフラグを設定
      if (shouldStartNewGame) {
        shouldAutoStartNewGameRef.current = true
        // やり直しモードをリセット
        isRetryModeRef.current = false
        retryStartMistakeWordsRef.current = []
      } else {
        shouldAutoStartNewGameRef.current = false
      }

      setView('gameover')
    },
    [gameState, onSessionEnd]
  )

  const startGame = useCallback(
    (wordsToPlay?: Word[]) => {
      if (words.length === 0) {
        toast.error('Add some words first!')
        return
      }

      // 間違った問題がある時は、復習モード（wordsToPlayが提供されている場合）以外では新しいゲームを開始できない
      // ただし、復習モード中に全ての単語を正解した場合は例外（shouldAutoStartNewGameRefがtrueの場合）
      // メニュー画面から呼び出された場合は、前のゲームのmistakeWordsを無視して新しいゲームを開始できる
      if (
        !wordsToPlay &&
        view === 'gameover' &&
        gameState.mistakeWords.length > 0 &&
        !shouldAutoStartNewGameRef.current
      ) {
        // 新しいゲームを開始できない（復習が必要）
        return
      }

      // 復習モード中に全ての単語を正解した場合のフラグをリセット
      if (shouldAutoStartNewGameRef.current) {
        shouldAutoStartNewGameRef.current = false
      }

      // Use provided words, or get words from callback (with settings applied), or fallback to shuffled words
      const gameWords =
        wordsToPlay || (getGameWords ? getGameWords() : [...words].sort(() => Math.random() - 0.5))

      // キーストローク記録をリセット
      keystrokesRef.current = []
      lastKeystrokeTimeRef.current = Date.now()
      previousKeyRef.current = null

      // 単語パフォーマンス記録をリセット
      wordPerformancesRef.current = []

      // やり直しモードかどうかを判定（wordsToPlay が提供されている場合はやり直しモード）
      const isRetryMode = wordsToPlay !== undefined
      isRetryModeRef.current = isRetryMode

      // やり直しモードの場合、現在の mistakeWords を保存
      if (isRetryMode) {
        retryStartMistakeWordsRef.current = [...gameState.mistakeWords]
      } else {
        // 通常モードの場合はやり直しフラグをリセット
        isRetryModeRef.current = false
        retryStartMistakeWordsRef.current = []
      }

      const now = Date.now()

      // 最初の単語の制限時間を計算
      const firstWord = gameWords[0]
      const initialTimeLimit =
        settings && firstWord ? calculateWordTimeLimit(firstWord, gameScores, settings) : 10

      // 最初の単語のパフォーマンス追跡を開始
      if (firstWord) {
        currentWordPerformanceRef.current = {
          wordId: firstWord.id,
          wordText: firstWord.text,
          reading: firstWord.reading,
          romaji: firstWord.romaji,
          startTime: now,
          firstKeyExpected: null,
          firstKeyActual: null,
          firstKeyCorrect: null,
          reactionTime: null,
          keystrokeCount: 0,
          missCount: 0,
        }
      }

      setGameState({
        isPlaying: true,
        currentWordIndex: 0,
        currentInput: '',
        timeRemaining: initialTimeLimit,
        totalTime: initialTimeLimit,
        words: gameWords,
        mistakeWords: isRetryMode ? [...retryStartMistakeWordsRef.current] : [],
        correctCount: 0,
        totalKeystrokes: 0,
        startTime: now,
        wordStartTime: now,
        currentWordMissCount: 0,
      })
      setView('game')
    },
    [words, getGameWords, gameScores, settings, gameState.mistakeWords, view]
  )

  const retryWeakWords = useCallback(() => {
    const weakWords = words.filter(w => gameState.mistakeWords.includes(w.id))
    if (weakWords.length > 0) {
      startGame(weakWords)
    } else {
      startGame()
    }
  }, [words, gameState.mistakeWords, startGame])

  const exitToMenu = useCallback(() => {
    setView('menu')
    setGameState(prev => ({ ...prev, isPlaying: false }))
  }, [])

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if focus is on input/textarea elements
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      // Menu screen shortcuts
      if (view === 'menu') {
        if (e.key === ' ') {
          e.preventDefault()
          if (words.length > 0) {
            startGame() // Uses getGameWords callback if provided to apply settings
          }
        }
        return
      }

      // Game over screen shortcuts
      if (view === 'gameover') {
        if (e.key === ' ') {
          e.preventDefault()
          // 失敗した問題がある時は復習、ない時は新しいゲームを開始
          // gameStats.wordPerformancesを使って実際の失敗を判定
          const hasFailedWords = gameStats.wordPerformances.some(p => p.result === 'failed')
          if (hasFailedWords) {
            retryWeakWords()
          } else {
            startGame() // Uses getGameWords callback if provided to apply settings
          }
        } else if (e.key === 'Escape') {
          e.preventDefault()
          setView('menu')
        }
        return
      }

      // Game screen shortcuts
      if (view !== 'game' || !gameState.isPlaying) return

      if (e.key === 'Escape') {
        exitToMenu()
        return
      }

      if (e.key === 'Backspace') {
        setGameState(prev => ({
          ...prev,
          currentInput: prev.currentInput.slice(0, -1),
        }))
        return
      }

      if (e.key.length === 1 && /[a-zA-Z0-9.\-_?!,;:'"]/.test(e.key)) {
        e.preventDefault()

        const currentWord = gameState.words[gameState.currentWordIndex]
        const newInput = gameState.currentInput + e.key.toLowerCase()
        const now = Date.now()

        // Validate current input (before adding new character)
        const prevValidation = validateRomajiInput(currentWord.romaji, gameState.currentInput)
        // Validate new input (after adding new character)
        const newValidation = validateRomajiInput(currentWord.romaji, newInput)

        // 期待されるキーを計算
        const matchingVariation = getMatchingVariation(currentWord.romaji, gameState.currentInput)
        const normalizedTarget = matchingVariation || normalizeRomaji(currentWord.romaji)
        const expectedKey = normalizedTarget[gameState.currentInput.length] || ''

        // 判定: 進捗が増えたか、または完了した場合は正しい入力
        const isCorrectInput =
          newValidation.progress > prevValidation.progress || newValidation.isCorrect

        // 初動記録: 最初のキー入力の場合
        if (gameState.currentInput === '' && currentWordPerformanceRef.current) {
          const wordStartTime = gameState.wordStartTime || now
          const reactionTime = now - wordStartTime
          const actualKey = e.key.toLowerCase()
          currentWordPerformanceRef.current.reactionTime = reactionTime
          currentWordPerformanceRef.current.firstKeyExpected = expectedKey
          currentWordPerformanceRef.current.firstKeyActual = actualKey
          // 最初のキーは期待されるキーと実際のキーを直接比較
          currentWordPerformanceRef.current.firstKeyCorrect =
            expectedKey.toLowerCase() === actualKey
        }

        // キーストロークを記録
        const latency = now - lastKeystrokeTimeRef.current
        const keystrokeRecord: KeystrokeRecord = {
          key: expectedKey,
          actualKey: e.key.toLowerCase(),
          isCorrect: isCorrectInput,
          timestamp: now,
          latency,
          previousKey: previousKeyRef.current,
        }
        keystrokesRef.current.push(keystrokeRecord)
        lastKeystrokeTimeRef.current = now

        // 現在の単語のキーストロークカウントを更新
        if (currentWordPerformanceRef.current) {
          currentWordPerformanceRef.current.keystrokeCount++
        }

        // If progress didn't increase, the new character is invalid - reject it
        if (newValidation.progress <= prevValidation.progress && !newValidation.isCorrect) {
          setShowError(true)
          setTimeout(() => setShowError(false), 200)
          updateWordStats(currentWord.id, false)

          // 現在の単語のミスカウントを更新
          if (currentWordPerformanceRef.current) {
            currentWordPerformanceRef.current.missCount++
          }

          // ミスペナルティを計算して適用
          const newMissCount = gameState.currentWordMissCount + 1
          let timePenalty = 0

          if (settings) {
            const difficultyParams: DifficultyParams = {
              targetKpsMultiplier: settings.targetKpsMultiplier,
              comfortZoneRatio: settings.comfortZoneRatio,
              minTimeLimitByDifficulty: settings.minTimeLimitByDifficulty,
              missPenaltyEnabled: settings.missPenaltyEnabled,
              basePenaltyPercent: settings.basePenaltyPercent,
              penaltyEscalationFactor: settings.penaltyEscalationFactor,
              maxPenaltyPercent: settings.maxPenaltyPercent,
              minTimeAfterPenalty: settings.minTimeAfterPenalty,
            }
            timePenalty = calculateMissPenalty(
              newMissCount,
              gameState.timeRemaining,
              difficultyParams
            )
          }

          setGameState(prev => ({
            ...prev,
            mistakeWords: prev.mistakeWords.includes(currentWord.id)
              ? prev.mistakeWords
              : [...prev.mistakeWords, currentWord.id],
            totalKeystrokes: prev.totalKeystrokes + 1,
            currentWordMissCount: newMissCount,
            timeRemaining: Math.max(0, prev.timeRemaining - timePenalty),
          }))
          // Don't accept the input - just return without updating currentInput
          return
        }

        // Input is valid - accept it
        previousKeyRef.current = e.key.toLowerCase()

        setGameState(prev => ({
          ...prev,
          currentInput: newInput,
          totalKeystrokes: prev.totalKeystrokes + 1,
        }))

        if (newValidation.isCorrect) {
          updateWordStats(currentWord.id, true)

          // 単語が完了したら previousKey をリセット（次の単語は新しい遷移）
          previousKeyRef.current = null
          const completionTime = Date.now()
          lastKeystrokeTimeRef.current = completionTime

          // 現在の単語のパフォーマンスを記録
          if (currentWordPerformanceRef.current) {
            const currentPerf = currentWordPerformanceRef.current
            const isCompleted = true
            const wordPerformance: WordPerformanceRecord = {
              wordId: currentPerf.wordId,
              wordText: currentPerf.wordText,
              reading: currentPerf.reading,
              romaji: currentPerf.romaji,
              firstKeyExpected: currentPerf.firstKeyExpected || '',
              firstKeyActual: currentPerf.firstKeyActual || '',
              firstKeyCorrect: currentPerf.firstKeyCorrect ?? true,
              reactionTime: currentPerf.reactionTime ?? 0,
              totalTime: completionTime - currentPerf.startTime,
              keystrokeCount: currentPerf.keystrokeCount,
              missCount: currentPerf.missCount,
              completed: isCompleted,
              result: determineWordResult(isCompleted, currentPerf.missCount),
            }
            wordPerformancesRef.current.push(wordPerformance)
          }

          // やり直しモード中で、成功した単語（ミスなく完了）は mistakeWords から削除
          const shouldRemoveFromMistakes =
            isRetryModeRef.current &&
            determineWordResult(true, currentWordPerformanceRef.current?.missCount ?? 0) ===
              'success'

          if (gameState.currentWordIndex + 1 >= gameState.words.length) {
            // 最後の単語が完了した場合も、mistakeWords から削除
            if (shouldRemoveFromMistakes) {
              setGameState(prev => ({
                ...prev,
                mistakeWords: prev.mistakeWords.filter(id => id !== currentWord.id),
              }))
            }
            endGame(true)
          } else {
            const nextWord = gameState.words[gameState.currentWordIndex + 1]

            // 次の単語の制限時間を計算（問題ごとにリセット）
            const nextTimeLimit =
              settings && nextWord ? calculateWordTimeLimit(nextWord, gameScores, settings) : 10

            // 次の単語のパフォーマンス追跡を開始
            currentWordPerformanceRef.current = {
              wordId: nextWord.id,
              wordText: nextWord.text,
              reading: nextWord.reading,
              romaji: nextWord.romaji,
              startTime: completionTime,
              firstKeyExpected: null,
              firstKeyActual: null,
              firstKeyCorrect: null,
              reactionTime: null,
              keystrokeCount: 0,
              missCount: 0,
            }

            setGameState(prev => ({
              ...prev,
              currentWordIndex: prev.currentWordIndex + 1,
              currentInput: '',
              timeRemaining: nextTimeLimit,
              totalTime: nextTimeLimit,
              correctCount: prev.correctCount + 1,
              wordStartTime: completionTime,
              currentWordMissCount: 0, // 次の単語ではミスカウントをリセット
              // やり直しモード中でミスなく正しく入力できた単語を mistakeWords から削除
              mistakeWords: shouldRemoveFromMistakes
                ? prev.mistakeWords.filter(id => id !== currentWord.id)
                : prev.mistakeWords,
            }))
          }
        }
      }
    },
    [
      view,
      gameState,
      gameStats,
      updateWordStats,
      words,
      startGame,
      retryWeakWords,
      exitToMenu,
      endGame,
      gameScores,
      settings,
    ]
  )

  const calculateLiveStats = useCallback(() => {
    if (!gameState.startTime) return { kps: 0, accuracy: 100 }

    const elapsed = (Date.now() - gameState.startTime) / 1000

    // KPS = 総打鍵数 / 経過時間（秒）
    const kps = elapsed > 0 ? Math.round((gameState.totalKeystrokes / elapsed) * 10) / 10 : 0

    // 正確率 = 成功ワード数（ミスなし完了）/ 完了ワード数 * 100
    // 成功ワード数 = 完了数 - 失敗（ミスあり）した単語数
    const successfulWords = gameState.correctCount - gameState.mistakeWords.length
    const accuracy =
      gameState.correctCount > 0
        ? Math.round((successfulWords / gameState.correctCount) * 100)
        : 100

    return { kps, accuracy }
  }, [
    gameState.startTime,
    gameState.correctCount,
    gameState.totalKeystrokes,
    gameState.mistakeWords.length,
  ])

  // Timer effect
  useEffect(() => {
    if (view === 'game' && gameState.isPlaying) {
      const interval = setInterval(() => {
        setGameState(prev => {
          if (prev.timeRemaining <= 0.1) {
            endGame(false)
            return prev
          }
          return {
            ...prev,
            timeRemaining: Math.max(0, prev.timeRemaining - 0.1),
          }
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [view, gameState.isPlaying, endGame])

  // Keyboard event effect
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  return {
    view,
    setView,
    gameState,
    showError,
    gameStats,
    startGame,
    retryWeakWords,
    exitToMenu,
    calculateLiveStats,
  }
}
