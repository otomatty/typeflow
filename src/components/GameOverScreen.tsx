import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, ArrowCounterClockwise } from '@phosphor-icons/react'
import { GameStats } from '@/lib/types'

interface GameOverScreenProps {
  stats: GameStats
  hasMistakes: boolean
  onRestart: () => void
  onRetryWeak: () => void
  onExit: () => void
}

export function GameOverScreen({ 
  stats, 
  hasMistakes, 
  onRestart, 
  onRetryWeak,
  onExit 
}: GameOverScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center min-h-screen p-4"
    >
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Game Over!</h2>
          <p className="text-muted-foreground">Great practice session</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-3xl sm:text-4xl font-bold text-primary">{stats.wpm}</div>
            <div className="text-xs sm:text-sm text-muted-foreground uppercase mt-1">WPM</div>
          </div>
          
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-3xl sm:text-4xl font-bold text-primary">{stats.accuracy}%</div>
            <div className="text-xs sm:text-sm text-muted-foreground uppercase mt-1">Accuracy</div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-center">
          <div className="flex justify-between px-4">
            <span className="text-muted-foreground">Correct Words:</span>
            <span className="font-bold">{stats.correctWords} / {stats.totalWords}</span>
          </div>
          <div className="flex justify-between px-4">
            <span className="text-muted-foreground">Total Time:</span>
            <span className="font-bold">{Math.round(stats.totalTime)}s</span>
          </div>
        </div>

        <div className="space-y-2">
          {hasMistakes && (
            <Button onClick={onRetryWeak} className="w-full gap-2">
              <ArrowCounterClockwise weight="bold" />
              Retry Weak Words
            </Button>
          )}
          
          <Button onClick={onRestart} variant="secondary" className="w-full gap-2">
            <Play weight="fill" />
            Play Again (All Words)
          </Button>
          
          <Button onClick={onExit} variant="outline" className="w-full">
            Back to Menu
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
