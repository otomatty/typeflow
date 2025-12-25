import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { TypingDisplay } from '@/components/TypingDisplay'
import { GameMetrics } from '@/components/GameMetrics'
import { TimeGauge } from '@/components/TimeGauge'
import { MinimalGameScreen } from '@/components/MinimalGameScreen'
import { useMinimalMode } from '@/hooks/useMinimalMode'
import { GameState, Word, MinimalModeType } from '@/lib/types'
import { RotateCcw } from 'lucide-react'

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
  const { t } = useTranslation()
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
      {/* 復習フェーズインジケーター */}
      {gameState.gamePhase === 'review' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-600 dark:text-amber-400 text-sm font-medium">
            <RotateCcw className="w-4 h-4" />
            <span>
              {t('game.reviewPhase', '復習')}
              {gameState.reviewRound > 1 &&
                ` (${t('game.round', 'ラウンド')} ${gameState.reviewRound})`}
              {' - '}
              {gameState.words.length}
              {t('game.wordsRemaining', '問')}
            </span>
          </div>
        </motion.div>
      )}

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
