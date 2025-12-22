import { AnimatePresence } from 'framer-motion'
import { TypingDisplay } from '@/components/TypingDisplay'
import { GameMetrics } from '@/components/GameMetrics'
import { TimeGauge } from '@/components/TimeGauge'
import { MinimalGameScreen } from '@/components/MinimalGameScreen'
import { useMinimalMode } from '@/hooks/useMinimalMode'
import { GameState, Word, MinimalModeType } from '@/lib/types'

interface GameScreenProps {
  currentWord: Word
  gameState: GameState
  showError: boolean
  liveStats: { kps: number; accuracy: number }
  minimalMode?: MinimalModeType
  minimalModeBreakpoint?: number
}

export function GameScreen({
  currentWord,
  gameState,
  showError,
  liveStats,
  minimalMode = 'auto',
  minimalModeBreakpoint = 600,
}: GameScreenProps) {
  const isMinimal = useMinimalMode(minimalMode, minimalModeBreakpoint)

  // ミニマルモードの場合はシンプルな画面を表示
  if (isMinimal) {
    return (
      <MinimalGameScreen
        currentWord={currentWord}
        gameState={gameState}
        showError={showError}
        liveStats={liveStats}
      />
    )
  }

  // 通常モード
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
        <TimeGauge timeRemaining={gameState.timeRemaining} totalTime={gameState.totalTime} />
        <GameMetrics gameState={gameState} kps={liveStats.kps} accuracy={liveStats.accuracy} />
      </div>
    </div>
  )
}
