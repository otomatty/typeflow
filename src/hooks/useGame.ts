import { useState, useEffect, useCallback } from 'react'
import { Word, GameState, GameStats } from '@/lib/types'
import { validateRomajiInput } from '@/lib/romaji-utils'
import { toast } from 'sonner'

export type ViewType = 'menu' | 'words' | 'game' | 'gameover'

interface UseGameProps {
  words: Word[]
  updateWordStats: (wordId: string, correct: boolean) => void
}

export function useGame({ words, updateWordStats }: UseGameProps) {
  const [view, setView] = useState<ViewType>('menu')
  const [gameState, setGameState] = useState<GameState>({
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
  })
  const [showError, setShowError] = useState(false)
  const [gameStats, setGameStats] = useState<GameStats>({
    wpm: 0,
    accuracy: 100,
    correctWords: 0,
    totalWords: 0,
    totalTime: 0,
  })

  const endGame = useCallback((completed: boolean = false) => {
    const endTime = Date.now()
    const startTime = gameState.startTime || endTime
    const totalSeconds = (endTime - startTime) / 1000
    const wordsCompleted = completed ? gameState.words.length : gameState.correctCount
    const wpm = Math.round((wordsCompleted / totalSeconds) * 60)
    const accuracy = gameState.totalKeystrokes > 0
      ? Math.round(((gameState.totalKeystrokes - gameState.mistakeWords.length) / gameState.totalKeystrokes) * 100)
      : 100

    setGameStats({
      wpm,
      accuracy,
      correctWords: wordsCompleted,
      totalWords: gameState.words.length,
      totalTime: totalSeconds,
    })

    setGameState((prev) => ({ ...prev, isPlaying: false }))
    setView('gameover')
  }, [gameState])

  const startGame = useCallback((wordsToPlay?: Word[]) => {
    if (words.length === 0) {
      toast.error('Add some words first!')
      return
    }

    const gameWords = wordsToPlay || [...words].sort(() => Math.random() - 0.5)
    
    setGameState({
      isPlaying: true,
      currentWordIndex: 0,
      currentInput: '',
      timeRemaining: 10,
      totalTime: 10,
      words: gameWords,
      mistakeWords: [],
      correctCount: 0,
      totalKeystrokes: 0,
      startTime: Date.now(),
    })
    setView('game')
  }, [words])

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
          startGame()
        }
      }
      return
    }

    // Game over screen shortcuts
    if (view === 'gameover') {
      if (e.key === 'Enter') {
        e.preventDefault()
        startGame()
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

    if (e.key.length === 1 && /[a-zA-Z0-9.\-_]/.test(e.key)) {
      e.preventDefault()
      
      const currentWord = gameState.words[gameState.currentWordIndex]
      const newInput = gameState.currentInput + e.key

      // Validate current input (before adding new character)
      const prevValidation = validateRomajiInput(currentWord.romaji, gameState.currentInput)
      // Validate new input (after adding new character)
      const newValidation = validateRomajiInput(currentWord.romaji, newInput)

      // If progress didn't increase, the new character is invalid - reject it
      if (newValidation.progress <= prevValidation.progress && !newValidation.isCorrect) {
        setShowError(true)
        setTimeout(() => setShowError(false), 200)
        updateWordStats(currentWord.id, false)
        
        setGameState((prev) => ({
          ...prev,
          mistakeWords: prev.mistakeWords.includes(currentWord.id) 
            ? prev.mistakeWords 
            : [...prev.mistakeWords, currentWord.id],
          totalKeystrokes: prev.totalKeystrokes + 1,
        }))
        // Don't accept the input - just return without updating currentInput
        return
      }

      // Input is valid - accept it
      setGameState((prev) => ({
        ...prev,
        currentInput: newInput,
        totalKeystrokes: prev.totalKeystrokes + 1,
      }))

      if (newValidation.isCorrect) {
        updateWordStats(currentWord.id, true)
        
        if (gameState.currentWordIndex + 1 >= gameState.words.length) {
          endGame(true)
        } else {
          setGameState((prev) => ({
            ...prev,
            currentWordIndex: prev.currentWordIndex + 1,
            currentInput: '',
            timeRemaining: Math.min(prev.timeRemaining + 3, prev.totalTime),
            correctCount: prev.correctCount + 1,
          }))
        }
      }
    }
  }, [view, gameState, updateWordStats, words, startGame, retryWeakWords, exitToMenu, endGame])

  const calculateLiveStats = useCallback(() => {
    if (!gameState.startTime) return { wpm: 0, accuracy: 100 }
    
    const elapsed = (Date.now() - gameState.startTime) / 1000
    const wpm = elapsed > 0 ? Math.round((gameState.correctCount / elapsed) * 60) : 0
    const accuracy = gameState.totalKeystrokes > 0
      ? Math.round(((gameState.totalKeystrokes - gameState.mistakeWords.length) / gameState.totalKeystrokes) * 100)
      : 100

    return { wpm, accuracy }
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
