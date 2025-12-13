import { useState, useEffect, useCallback, useRef } from 'react'
import { Word, GameState, GameStats, KeystrokeRecord, AppSettings, DifficultyParams } from '@/lib/types'
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
  // 動的制限時間用
  gameScores?: GameScoreRecord[]
  settings?: AppSettings
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
  })

  // キーストローク記録用
  const keystrokesRef = useRef<KeystrokeRecord[]>([])
  const lastKeystrokeTimeRef = useRef<number>(0)
  const previousKeyRef = useRef<string | null>(null)

  const endGame = useCallback((completed: boolean = false) => {
    const endTime = Date.now()
    const startTime = gameState.startTime || endTime
    const totalSeconds = (endTime - startTime) / 1000
    const wordsCompleted = completed ? gameState.words.length : gameState.correctCount
    
    // KPS = 総打鍵数 / 総時間（秒）
    const kps = totalSeconds > 0 
      ? Math.round((gameState.totalKeystrokes / totalSeconds) * 10) / 10 
      : 0
    
    // ノーミスで完了したワード数 = 完了ワード数 - ミスがあったワード数
    const perfectWords = wordsCompleted - gameState.mistakeWords.length
    
    // 正確率 = ノーミスワード数 / 完了ワード数 * 100
    const accuracy = wordsCompleted > 0
      ? Math.round((perfectWords / wordsCompleted) * 100)
      : 100

    setGameStats({
      kps,
      totalKeystrokes: gameState.totalKeystrokes,
      accuracy,
      correctWords: wordsCompleted,
      perfectWords: Math.max(0, perfectWords),
      totalWords: gameState.words.length,
      totalTime: totalSeconds,
    })

    // セッション終了時にキーストローク記録を渡す
    if (onSessionEnd && keystrokesRef.current.length > 0) {
      onSessionEnd(keystrokesRef.current)
    }

    setGameState((prev) => ({ ...prev, isPlaying: false }))
    setView('gameover')
  }, [gameState, onSessionEnd])

  const startGame = useCallback((wordsToPlay?: Word[]) => {
    if (words.length === 0) {
      toast.error('Add some words first!')
      return
    }

    // Use provided words, or get words from callback (with settings applied), or fallback to shuffled words
    const gameWords = wordsToPlay || (getGameWords ? getGameWords() : [...words].sort(() => Math.random() - 0.5))
    
    // キーストローク記録をリセット
    keystrokesRef.current = []
    lastKeystrokeTimeRef.current = Date.now()
    previousKeyRef.current = null
    
    // 最初の単語の制限時間を計算
    const firstWord = gameWords[0]
    const initialTimeLimit = settings && firstWord
      ? calculateWordTimeLimit(firstWord, gameScores, settings)
      : 10
    
    setGameState({
      isPlaying: true,
      currentWordIndex: 0,
      currentInput: '',
      timeRemaining: initialTimeLimit,
      totalTime: initialTimeLimit,
      words: gameWords,
      mistakeWords: [],
      correctCount: 0,
      totalKeystrokes: 0,
      startTime: Date.now(),
      currentWordMissCount: 0,
    })
    setView('game')
  }, [words, getGameWords, gameScores, settings])

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
      if (e.key === 'Enter') {
        e.preventDefault()
        startGame()  // Uses getGameWords callback if provided to apply settings
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        retryWeakWords()
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

      // キーストロークを記録
      const latency = now - lastKeystrokeTimeRef.current
      const keystrokeRecord: KeystrokeRecord = {
        key: expectedKey,
        actualKey: e.key.toLowerCase(),
        isCorrect: newValidation.progress > prevValidation.progress || newValidation.isCorrect,
        timestamp: now,
        latency,
        previousKey: previousKeyRef.current,
      }
      keystrokesRef.current.push(keystrokeRecord)
      lastKeystrokeTimeRef.current = now

      // If progress didn't increase, the new character is invalid - reject it
      if (newValidation.progress <= prevValidation.progress && !newValidation.isCorrect) {
        setShowError(true)
        setTimeout(() => setShowError(false), 200)
        updateWordStats(currentWord.id, false)
        
        // ミスペナルティを計算して適用
        const newMissCount = gameState.currentWordMissCount + 1
        let timePenalty = 0
        
        if (settings) {
          const difficultyParams: DifficultyParams = {
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
        lastKeystrokeTimeRef.current = Date.now()
        
        if (gameState.currentWordIndex + 1 >= gameState.words.length) {
          endGame(true)
        } else {
          const nextWord = gameState.words[gameState.currentWordIndex + 1]
          
          // 次の単語の制限時間を計算（問題ごとにリセット）
          const nextTimeLimit = settings && nextWord
            ? calculateWordTimeLimit(nextWord, gameScores, settings)
            : 10
          
          setGameState((prev) => ({
            ...prev,
            currentWordIndex: prev.currentWordIndex + 1,
            currentInput: '',
            timeRemaining: nextTimeLimit,
            totalTime: nextTimeLimit,
            correctCount: prev.correctCount + 1,
            currentWordMissCount: 0,  // 次の単語ではミスカウントをリセット
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
