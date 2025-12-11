import { GameState } from '@/lib/types'

interface GameMetricsProps {
  gameState: GameState
  kps: number
  accuracy: number
}

export function GameMetrics({ gameState, kps, accuracy }: GameMetricsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm px-2">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground uppercase tracking-wide">KPS</span>
        <span className="text-primary font-bold tabular-nums">{kps}</span>
      </div>
      
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground uppercase tracking-wide">ACC</span>
        <span className="text-primary font-bold tabular-nums">{accuracy}%</span>
      </div>
      
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground uppercase tracking-wide">KEYS</span>
        <span className="text-primary font-bold tabular-nums">
          {gameState.totalKeystrokes}
        </span>
      </div>
      
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground uppercase tracking-wide">WORDS</span>
        <span className="text-primary font-bold tabular-nums">
          {gameState.currentWordIndex}/{gameState.words.length}
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground/60">
        <kbd className="px-1.5 py-0.5 text-xs bg-secondary/50 rounded border border-border/30">Esc</kbd>
        <span className="text-xs">Exit</span>
      </div>
    </div>
  )
}
