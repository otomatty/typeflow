import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, Keyboard, ChartLine } from '@phosphor-icons/react'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from '@/components/ui/sonner'
import { TypingDisplay } from '@/components/TypingDisplay'
import { GameMetrics } from '@/components/GameMetrics'
import { TimeGauge } from '@/components/TimeGauge'
import { AddWordDialog } from '@/components/AddWordDialog'
import { WordList } from '@/components/WordList'
import { GameOverScreen } from '@/components/GameOverScreen'
import { Word, GameState, GameStats } from '@/lib/types'
import { validateRomajiInput, normalizeRomaji } from '@/lib/romaji-utils'
import { toast } from 'sonner'

function App() {
  const [words, setWords] = useKV<Word[]>('typeflow-words', [])
  const [view, setView] = useState<'menu' | 'game' | 'gameover'>('menu')
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

  const addWord = useCallback((wordData: Omit<Word, 'id' | 'stats'>) => {
    const newWord: Word = {
      id: `word-${Date.now()}-${Math.random()}`,
      ...wordData,
      stats: {
        correct: 0,
        miss: 0,
        lastPlayed: Date.now(),
        accuracy: 100,
      },
    }

    setWords((current) => [...(current || []), newWord])
    toast.success('Word added successfully!')
  }, [setWords])

  const deleteWord = useCallback((id: string) => {
    setWords((current) => (current || []).filter((w) => w.id !== id))
    toast.success('Word deleted')
  }, [setWords])

  const updateWordStats = useCallback((wordId: string, correct: boolean) => {
    setWords((current) =>
      (current || []).map((w) => {
        if (w.id !== wordId) return w
        
        const newCorrect = correct ? w.stats.correct + 1 : w.stats.correct
        const newMiss = correct ? w.stats.miss : w.stats.miss + 1
        const total = newCorrect + newMiss
        const accuracy = total > 0 ? (newCorrect / total) * 100 : 100

        return {
          ...w,
          stats: {
            ...w.stats,
            correct: newCorrect,
            miss: newMiss,
            lastPlayed: Date.now(),
            accuracy,
          },
        }
      })
    )
  }, [setWords])

  const startGame = useCallback((wordsToPlay?: Word[]) => {
    const wordList = words || []
    if (wordList.length === 0) {
      toast.error('Add some words first!')
      return
    }

    const gameWords = wordsToPlay || [...wordList].sort(() => Math.random() - 0.5)
    
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

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (view !== 'game' || !gameState.isPlaying) return

    if (e.key === 'Escape') {
      setView('menu')
      setGameState((prev) => ({ ...prev, isPlaying: false }))
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

      const validation = validateRomajiInput(currentWord.romaji, newInput)

      if (validation.progress === 0 && newInput.length > 0) {
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
        return
      }

      setGameState((prev) => ({
        ...prev,
        currentInput: newInput,
        totalKeystrokes: prev.totalKeystrokes + 1,
      }))

      if (validation.isCorrect) {
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
  }, [view, gameState, updateWordStats])

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

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const calculateLiveStats = () => {
    if (!gameState.startTime) return { wpm: 0, accuracy: 100 }
    
    const elapsed = (Date.now() - gameState.startTime) / 1000
    const wpm = elapsed > 0 ? Math.round((gameState.correctCount / elapsed) * 60) : 0
    const accuracy = gameState.totalKeystrokes > 0
      ? Math.round(((gameState.totalKeystrokes - gameState.mistakeWords.length) / gameState.totalKeystrokes) * 100)
      : 100

    return { wpm, accuracy }
  }

  const retryWeakWords = () => {
    const wordList = words || []
    const weakWords = wordList.filter((w) => gameState.mistakeWords.includes(w.id))
    if (weakWords.length > 0) {
      startGame(weakWords)
    } else {
      startGame()
    }
  }

  if (view === 'gameover') {
    return (
      <>
        <Toaster />
        <GameOverScreen
          stats={gameStats}
          hasMistakes={gameState.mistakeWords.length > 0}
          onRestart={() => startGame()}
          onRetryWeak={retryWeakWords}
          onExit={() => setView('menu')}
        />
      </>
    )
  }

  if (view === 'game' && gameState.isPlaying) {
    const currentWord = gameState.words[gameState.currentWordIndex]
    const liveStats = calculateLiveStats()

    return (
      <>
        <Toaster />
        <div className="min-h-screen flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-3xl">
              <AnimatePresence mode="wait">
                <TypingDisplay
                  key={currentWord.id}
                  word={currentWord}
                  currentInput={gameState.currentInput}
                  showError={showError}
                />
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-3 pb-6">
            <TimeGauge
              timeRemaining={gameState.timeRemaining}
              totalTime={gameState.totalTime}
            />
            <GameMetrics
              gameState={gameState}
              wpm={liveStats.wpm}
              accuracy={liveStats.accuracy}
            />
          </div>
        </div>
      </>
    )
  }

  const wordList = words || []

  return (
    <>
      <Toaster />
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">
              TypeFlow
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Developer Typing Trainer
            </p>
          </div>

          {wordList.length > 0 && (
            <Card className="mb-6 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button onClick={() => startGame()} size="lg" className="gap-2 w-full sm:w-auto">
                  <Play weight="fill" />
                  Start Practice
                </Button>
                <AddWordDialog onAddWord={addWord} />
              </div>
            </Card>
          )}

          <Tabs defaultValue="words" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="words" className="gap-2">
                <Keyboard />
                <span>Words</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <ChartLine />
                <span>Stats</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="words" className="space-y-4">
              {wordList.length === 0 && (
                <Card className="p-8 text-center space-y-4">
                  <p className="text-muted-foreground">
                    No words yet. Add your first word to start practicing!
                  </p>
                  <AddWordDialog onAddWord={addWord} />
                </Card>
              )}
              <WordList words={wordList} onDeleteWord={deleteWord} />
            </TabsContent>

            <TabsContent value="stats">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Weakest Words</h3>
                <WordList
                  words={wordList
                    .filter((w) => w.stats.correct + w.stats.miss > 0)
                    .sort((a, b) => a.stats.accuracy - b.stats.accuracy)
                    .slice(0, 10)}
                  onDeleteWord={deleteWord}
                />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

export default App