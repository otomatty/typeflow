import { memo } from 'react'
import { useTranslation } from 'react-i18next'

interface GameMetricsProps {
  totalKeystrokes: number
  currentWordIndex: number
  wordsLength: number
  kps: number
  accuracy: number
}

// プリミティブな props のみを受け取り memo 化する。
// （gameState オブジェクト全体を渡すとタイマーの100ms更新ごとに参照が変わり
//  再レンダリングを避けられないため、必要な値だけを渡す）
export const GameMetrics = memo(function GameMetrics({
  totalKeystrokes,
  currentWordIndex,
  wordsLength,
  kps,
  accuracy,
}: GameMetricsProps) {
  const { t } = useTranslation('game')

  return (
    <div
      role="status"
      aria-live="off"
      aria-label={t('a11y.metrics_label')}
      className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm px-2"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground uppercase tracking-wide">{t('kps')}</span>
        <span className="text-primary font-bold tabular-nums">{kps}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground uppercase tracking-wide">ACC</span>
        <span className="text-primary font-bold tabular-nums">{accuracy}%</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground uppercase tracking-wide">{t('keys')}</span>
        <span className="text-primary font-bold tabular-nums">{totalKeystrokes}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground uppercase tracking-wide">{t('words')}</span>
        <span className="text-primary font-bold tabular-nums">
          {currentWordIndex}/{wordsLength}
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground/60">
        <kbd
          aria-hidden="true"
          className="px-1.5 py-0.5 text-xs bg-secondary/50 rounded border border-border/30"
        >
          Esc
        </kbd>
        <span className="text-xs">{t('exit')}</span>
      </div>
    </div>
  )
})
