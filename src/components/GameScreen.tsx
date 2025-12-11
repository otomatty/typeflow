import { AnimatePresence } from 'framer-motion'
import { TypingDisplay } from '@/components/TypingDisplay'
import { GameMetrics } from '@/components/GameMetrics'
import { TimeGauge } from '@/components/TimeGauge'
import { GameState, Word } from '@/lib/types'

interface GameScreenProps {
  currentWord: Word
  gameState: GameState
  showError: boolean
  liveStats: { wpm: number; accuracy: number }
}

export function GameScreen({ currentWord, gameState, showError, liveStats }: GameScreenProps) {
  return (
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
  )
}
