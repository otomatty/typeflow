import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { KeyStats } from '@/lib/types'

interface KeyboardHeatmapProps {
  keyStats: Record<string, KeyStats>
}

// QWERTYキーボードレイアウト
const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
]

// エラー率に基づいて色を計算
function getKeyColor(errorRate: number | null): string {
  if (errorRate === null) {
    return 'bg-muted text-muted-foreground'
  }

  // エラー率 0% → 緑, 50%+ → 赤
  if (errorRate < 0.05) {
    return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
  } else if (errorRate < 0.15) {
    return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
  } else if (errorRate < 0.3) {
    return 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30'
  } else {
    return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'
  }
}

export function KeyboardHeatmap({ keyStats }: KeyboardHeatmapProps) {
  const { t } = useTranslation('stats')

  // 各キーのエラー率を計算
  const keyErrorRates = useMemo(() => {
    const rates: Record<string, number | null> = {}

    for (const row of KEYBOARD_ROWS) {
      for (const key of row) {
        const stats = keyStats[key]
        if (stats && stats.totalCount >= 3) {
          rates[key] = stats.errorCount / stats.totalCount
        } else {
          rates[key] = null
        }
      }
    }

    return rates
  }, [keyStats])

  return (
    <div className="space-y-3">
      <div
        className="flex flex-col items-center gap-1.5"
        role="group"
        aria-label={t('heatmap.group_label')}
      >
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex gap-1"
            style={{ marginLeft: rowIndex === 1 ? '1rem' : rowIndex === 2 ? '2rem' : 0 }}
          >
            {row.map(key => {
              const errorRate = keyErrorRates[key]
              const stats = keyStats[key]
              const hasData = errorRate !== null

              const ariaLabel =
                hasData && stats
                  ? t('heatmap.key_label', {
                      key: key.toUpperCase(),
                      percent: Math.round((errorRate ?? 0) * 100),
                      count: stats.totalCount,
                    })
                  : t('heatmap.key_label_no_data', { key: key.toUpperCase() })

              return (
                <div
                  key={key}
                  role="img"
                  aria-label={ariaLabel}
                  className={`
                    w-8 h-8 sm:w-10 sm:h-10
                    flex items-center justify-center
                    rounded-md border font-mono text-sm sm:text-base font-medium
                    transition-colors
                    ${getKeyColor(errorRate)}
                  `}
                  title={ariaLabel}
                >
                  <span aria-hidden="true">{key.toUpperCase()}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30"
            aria-hidden="true"
          />
          <span>{t('heatmap.legend_high')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/30"
            aria-hidden="true"
          />
          <span>{t('heatmap.legend_medium')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/30"
            aria-hidden="true"
          />
          <span>{t('heatmap.legend_low')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30"
            aria-hidden="true"
          />
          <span>{t('heatmap.legend_good')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted border border-border" aria-hidden="true" />
          <span>{t('heatmap.legend_no_data')}</span>
        </div>
      </div>
    </div>
  )
}
