import { useState, useEffect, useCallback, useRef } from 'react'
import { Word, GameState, GameStats, KeystrokeRecord, AppSettings, DifficultyParams, WordPerformanceRecord } from '@/lib/types'
import { validateRomajiInput, getMatchingVariation, normalizeRomaji } from '@/lib/romaji-utils'
import { calculateWordTimeLimit } from '@/lib/adaptive-time-utils'
import { calculateMissPenalty } from '@/lib/difficulty-presets'
import { GameScoreRecord } from '@/lib/db'
import { toast } from 'sonner'

export type ViewType = 'menu' | 'words' | 'stats' | 'settings' | 'game' | 'gameover'

interface UseGameProps {
  words: Word[]
  updateWordStats: (wordId: string, correct: boolean) => void
  onSessionEnd?: (keystrokes: KeystrokeRecord[]) => void
  getGameWords?: () => Word[]  // Returns words with settings applied (e.g., word count limit)
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

export function useGame({ words, updateWordStats, onSessionEnd, getGameWords, gameScores = [], settings }: UseGameProps) {
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
    currentWordMissCount: 0,  // 現在の単語でのミス数（ペナルティ計算用）
  })
  const [showError, setShowError] = useState(false)
  const [gameStats, setGameStats] = useState<GameStats>({
    kps: 0,
    totalKeystrokes: 0,
    accuracy: 100,
    correctWords: 0,
    perfectWords: 0,
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

  const endGame = useCallback((completed: boolean = false) => {
    const endTime = Date.now()
    const startTime = gameState.startTime || endTime
    const totalSeconds = (endTime - startTime) / 1000
    const wordsCompleted = completed ? gameState.words.length : gameState.correctCount
    
    // タイムアウト時: 現在の単語のパフォーマンスを記録（未完了として）
    if (!completed && currentWordPerformanceRef.current) {
      const currentPerf = currentWordPerformanceRef.current
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
        completed: false,
      }
      wordPerformancesRef.current.push(wordPerformance)
    }
    
    // やり直しモード中にタイムアウトした場合、mistakeWords をやり直し開始時の状態に復元
    // 完了時は、既に正解した単語が削除されている gameState.mistakeWords を使用
    let finalMistakeWords = gameState.mistakeWords
    if (!completed && isRetryModeRef.current) {
      finalMistakeWords = [...retryStartMistakeWordsRef.current]
    }
    
    // やり直しモード中に全ての単語を正解した場合（mistakeWords が空になった場合）、新しいゲームを自動的に開始
    const shouldStartNewGame = completed && isRetryModeRef.current && finalMistakeWords.length === 0
    
    // KPS = 総打鍵数 / 総時間（秒）
    const kps = totalSeconds > 0 
      ? Math.round((gameState.totalKeystrokes / totalSeconds) * 10) / 10 
      : 0
    
    // ノーミスで完了したワード数 = 完了ワード数 - ミスがあったワード数
    const perfectWords = wordsCompleted - finalMistakeWords.length
    
    // 正確率 = ノーミスワード数 / 完了ワード数 * 100
    const accuracy = wordsCompleted > 0
      ? Math.round((perfectWords / wordsCompleted) * 100)
      : 100
    
    // 初動統計を計算
    const performances = wordPerformancesRef.current
    const performancesWithReaction = performances.filter(p => p.reactionTime > 0)
    const avgReactionTime = performancesWithReaction.length > 0
      ? Math.round(performancesWithReaction.reduce((sum, p) => sum + p.reactionTime, 0) / performancesWithReaction.length)
      : 0
    
    const performancesWithFirstKey = performances.filter(p => p.firstKeyExpected !== '')
    const firstKeyCorrectCount = performancesWithFirstKey.filter(p => p.firstKeyCorrect).length
    const firstKeyAccuracy = performancesWithFirstKey.length > 0
      ? Math.round((firstKeyCorrectCount / performancesWithFirstKey.length) * 100)
      : 100

    setGameStats({
      kps,
      totalKeystrokes: gameState.totalKeystrokes,
      accuracy,
      correctWords: wordsCompleted,
      perfectWords: Math.max(0, perfectWords),
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

    setGameState((prev) => ({ 
      ...prev, 
      isPlaying: false,
      mistakeWords: finalMistakeWords,  // 復元した mistakeWords を設定
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
  }, [gameState, onSessionEnd])

  const startGame = useCallback((wordsToPlay?: Word[]) => {
    if (words.length === 0) {
      toast.error('Add some words first!')
      return
    }

    // 間違った問題がある時は、復習モード（wordsToPlayが提供されている場合）以外では新しいゲームを開始できない
    // ただし、復習モード中に全ての単語を正解した場合は例外（shouldAutoStartNewGameRefがtrueの場合）
    // メニュー画面から呼び出された場合は、前のゲームのmistakeWordsを無視して新しいゲームを開始できる
    if (!wordsToPlay && view === 'gameover' && gameState.mistakeWords.length > 0 && !shouldAutoStartNewGameRef.current) {
      // 新しいゲームを開始できない（復習が必要）
      return
    }

    // 復習モード中に全ての単語を正解した場合のフラグをリセット
    if (shouldAutoStartNewGameRef.current) {
      shouldAutoStartNewGameRef.current = false
    }

    // Use provided words, or get words from callback (with settings applied), or fallback to shuffled words
    const gameWords = wordsToPlay || (getGameWords ? getGameWords() : [...words].sort(() => Math.random() - 0.5))
    
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
    const initialTimeLimit = settings && firstWord
      ? calculateWordTimeLimit(firstWord, gameScores, settings)
      : 10
    
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
  }, [words, getGameWords, gameScores, settings, gameState.mistakeWords, view])

  const retryWeakWords = useCallback(() => {
    const weakWords = words.filter((w) => gameState.mistakeWords.includes(w.id))
    if (weakWords.length > 0) {
      startGame(weakWords)
    } else {
      startGame()
    }
  }, [words, gameState.mistakeWords, startGame])

  const exitToMenu = useCallback(() => {
    setView('menu')
    setGameState((prev) => ({ ...prev, isPlaying: false }))
  }, [])

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Ignore if focus is on input/textarea elements
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

    // Menu screen shortcuts
    if (view === 'menu') {
      if (e.key === ' ') {
        e.preventDefault()
        if (words.length > 0) {
          startGame()  // Uses getGameWords callback if provided to apply settings
        }
      }
      return
    }

    // Game over screen shortcuts
    if (view === 'gameover') {
      if (e.key === ' ') {
        e.preventDefault()
        // 間違った問題がある時は復習、ない時は新しいゲームを開始
        if (gameState.mistakeWords.length > 0) {
          retryWeakWords()
        } else {
          startGame()  // Uses getGameWords callback if provided to apply settings
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
      setGameState((prev) => ({
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
      const isCorrectInput = newValidation.progress > prevValidation.progress || newValidation.isCorrect

      // 初動記録: 最初のキー入力の場合
      if (gameState.currentInput === '' && currentWordPerformanceRef.current) {
        const wordStartTime = gameState.wordStartTime || now
        const reactionTime = now - wordStartTime
        const actualKey = e.key.toLowerCase()
        currentWordPerformanceRef.current.reactionTime = reactionTime
        currentWordPerformanceRef.current.firstKeyExpected = expectedKey
        currentWordPerformanceRef.current.firstKeyActual = actualKey
        // 最初のキーは期待されるキーと実際のキーを直接比較
        currentWordPerformanceRef.current.firstKeyCorrect = expectedKey.toLowerCase() === actualKey
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
            missPenaltyEnabled: settings.missPenaltyEnabled,
            basePenaltyPercent: settings.basePenaltyPercent,
            penaltyEscalationFactor: settings.penaltyEscalationFactor,
            maxPenaltyPercent: settings.maxPenaltyPercent,
            minTimeAfterPenalty: settings.minTimeAfterPenalty,
          }
          timePenalty = calculateMissPenalty(newMissCount, gameState.timeRemaining, difficultyParams)
        }
        
        setGameState((prev) => ({
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
      
      setGameState((prev) => ({
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
            completed: true,
          }
          wordPerformancesRef.current.push(wordPerformance)
        }
        
        // やり直しモード中で、ミスなく正しく入力できた単語は mistakeWords から削除
        const shouldRemoveFromMistakes = isRetryModeRef.current && 
                                         currentWordPerformanceRef.current?.missCount === 0
        
        if (gameState.currentWordIndex + 1 >= gameState.words.length) {
          // 最後の単語が完了した場合も、mistakeWords から削除
          if (shouldRemoveFromMistakes) {
            setGameState((prev) => ({
              ...prev,
              mistakeWords: prev.mistakeWords.filter(id => id !== currentWord.id),
            }))
          }
          endGame(true)
        } else {
          const nextWord = gameState.words[gameState.currentWordIndex + 1]
          
          // 次の単語の制限時間を計算（問題ごとにリセット）
          const nextTimeLimit = settings && nextWord
            ? calculateWordTimeLimit(nextWord, gameScores, settings)
            : 10
          
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
          
          setGameState((prev) => ({
            ...prev,
            currentWordIndex: prev.currentWordIndex + 1,
            currentInput: '',
            timeRemaining: nextTimeLimit,
            totalTime: nextTimeLimit,
            correctCount: prev.correctCount + 1,
            wordStartTime: completionTime,
            currentWordMissCount: 0,  // 次の単語ではミスカウントをリセット
            // やり直しモード中でミスなく正しく入力できた単語を mistakeWords から削除
            mistakeWords: shouldRemoveFromMistakes
              ? prev.mistakeWords.filter(id => id !== currentWord.id)
              : prev.mistakeWords,
          }))
        }
      }
    }
  }, [view, gameState, updateWordStats, words, startGame, retryWeakWords, exitToMenu, endGame, gameScores, settings])

  const calculateLiveStats = useCallback(() => {
    if (!gameState.startTime) return { kps: 0, accuracy: 100 }
    
    const elapsed = (Date.now() - gameState.startTime) / 1000
    
    // KPS = 総打鍵数 / 経過時間（秒）
    const kps = elapsed > 0 
      ? Math.round((gameState.totalKeystrokes / elapsed) * 10) / 10 
      : 0
    
    // 正確率 = ノーミスワード数 / 完了ワード数 * 100
    const perfectWords = gameState.correctCount - gameState.mistakeWords.length
    const accuracy = gameState.correctCount > 0
      ? Math.round((perfectWords / gameState.correctCount) * 100)
      : 100

    return { kps, accuracy }
  }, [gameState.startTime, gameState.correctCount, gameState.totalKeystrokes, gameState.mistakeWords.length])

  // Timer effect
  useEffect(() => {
    if (view === 'game' && gameState.isPlaying) {
      const interval = setInterval(() => {
        setGameState((prev) => {
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

  // やり直しモード中に全ての単語を正解した場合、新しいゲームを自動的に開始
  useEffect(() => {
    if (view === 'gameover' && shouldAutoStartNewGameRef.current && gameState.mistakeWords.length === 0) {
      shouldAutoStartNewGameRef.current = false
      // 少し遅延を入れてから新しいゲームを開始（統計表示を一瞬見せるため）
      const timer = setTimeout(() => {
        startGame()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [view, gameState.mistakeWords.length, startGame])

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
