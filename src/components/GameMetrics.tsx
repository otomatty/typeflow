import { GameState } from '@/lib/types'

interface GameMetricsProps {
  gameState: GameState
  wpm: number
  accuracy: number
}

export function GameMetrics({ gameState, wpm, accuracy }: GameMetricsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm px-2">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground uppercase tracking-wide">WPM</span>
        <span className="text-primary font-bold tabular-nums">{wpm}</span>
      </div>
      
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground uppercase tracking-wide">ACC</span>
        <span className="text-primary font-bold tabular-nums">{accuracy}%</span>
      </div>
      
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground uppercase tracking-wide">WORDS</span>
        <span className="text-primary font-bold tabular-nums">
          {gameState.currentWordIndex}/{gameState.words.length}
        </span>
      </div>
    </div>
  )
}
