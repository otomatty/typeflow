import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash, Keyboard, ArrowRight, Warning, Swap, ChartLine } from '@phosphor-icons/react'
import { KeyboardHeatmap } from '@/components/KeyboardHeatmap'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Container } from '@/components/Container'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { XAxis, YAxis, CartesianGrid, ComposedChart, Area, Line, Legend } from 'recharts'
import type { KeyStats, KeyTransitionStats } from '@/lib/types'
import type { GameScoreRecord } from '@/lib/db'

interface StatsScreenProps {
  keyStats: Record<string, KeyStats>
  transitionStats: Record<string, KeyTransitionStats>
  gameScores: GameScoreRecord[]
  onReset: () => void
}

export function StatsScreen({ keyStats, transitionStats, gameScores, onReset }: StatsScreenProps) {
  const { t, i18n } = useTranslation('stats')
  const { t: tc } = useTranslation('common')

  // Calculate summary statistics
  const summary = useMemo(() => {
    const allKeys = Object.values(keyStats)
    const totalKeystrokes = allKeys.reduce((sum, k) => sum + k.totalCount, 0)
    const totalErrors = allKeys.reduce((sum, k) => sum + k.errorCount, 0)
    const totalLatency = allKeys.reduce((sum, k) => sum + k.totalLatency, 0)
    
    const accuracy = totalKeystrokes > 0 
      ? Math.round((1 - totalErrors / totalKeystrokes) * 1000) / 10 
      : 100
    const avgLatency = totalKeystrokes > 0 
      ? Math.round(totalLatency / totalKeystrokes) 
      : 0

    return {
      totalKeystrokes,
      totalErrors,
      accuracy,
      avgLatency,
    }
  }, [keyStats])

  // Prepare chart data (最新30件を古い順に並べる、マイナス値は0に変換)
  const chartData = useMemo(() => {
    const scores = [...gameScores].reverse().slice(-30)
    const locale = i18n.language?.startsWith('ja') ? 'ja-JP' : 'en-US'
    return scores.map((score, index) => ({
      game: index + 1,
      kps: Math.max(0, score.kps),
      accuracy: Math.max(0, score.accuracy),
      correctWords: Math.max(0, score.correctWords),
      date: new Date(score.playedAt).toLocaleDateString(locale, { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    }))
  }, [gameScores, i18n.language])

  // Combined chart configuration
  const combinedChartConfig: ChartConfig = {
    kps: {
      label: 'KPS',
      color: 'hsl(var(--chart-1))',
    },
    accuracy: {
      label: t('accuracy'),
      color: 'hsl(var(--chart-2))',
    },
    correctWords: {
      label: t('words_chart'),
      color: 'hsl(var(--chart-3))',
    },
  }

  // Weak transitions Top 5
  const weakTransitions = useMemo(() => {
    return Object.values(transitionStats)
      .filter(t => t.totalCount >= 3)
      .map(t => ({
        ...t,
        errorRate: t.errorCount / t.totalCount,
        avgLatency: Math.round(t.totalLatency / t.totalCount),
      }))
      .sort((a, b) => {
        const scoreA = a.errorRate * 0.6 + Math.min(a.avgLatency / 500, 1) * 0.4
        const scoreB = b.errorRate * 0.6 + Math.min(b.avgLatency / 500, 1) * 0.4
        return scoreB - scoreA
      })
      .slice(0, 5)
  }, [transitionStats])

  // Commonly confused key pairs Top 5
  const confusionPairs = useMemo(() => {
    const pairs: Array<{ expected: string; actual: string; count: number }> = []
    
    for (const stats of Object.values(keyStats)) {
      for (const [actualKey, count] of Object.entries(stats.confusedWith)) {
        pairs.push({
          expected: stats.key,
          actual: actualKey,
          count,
        })
      }
    }
    
    return pairs
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [keyStats])

  const hasData = summary.totalKeystrokes > 0

  return (
    <Container className="space-y-6">
      <ScreenHeader
        title={t('title')}
        description={t('description')}
      />

        {!hasData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-8 text-center">
              <Keyboard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold mb-2">{t('no_data')}</h2>
              <p className="text-muted-foreground text-sm">
                {t('no_data_desc')}
              </p>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">
                      {summary.totalKeystrokes.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase mt-1">{t('keystrokes')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">
                      {summary.accuracy}%
                    </div>
                    <div className="text-xs text-muted-foreground uppercase mt-1">{t('accuracy')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">
                      {summary.totalErrors.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase mt-1">{t('errors')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">
                      {summary.avgLatency}ms
                    </div>
                    <div className="text-xs text-muted-foreground uppercase mt-1">{t('avg_latency')}</div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Performance Charts */}
            {chartData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="p-4 sm:p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ChartLine className="w-5 h-5" />
                    {t('performance_history')}
                  </h2>
                  <ChartContainer config={combinedChartConfig} className="h-[300px] w-full">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="kpsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="wordsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis 
                        dataKey="game" 
                        tickLine={false} 
                        axisLine={false}
                        className="text-xs"
                      />
                      {/* Left Y-axis for KPS */}
                      <YAxis 
                        yAxisId="left"
                        tickLine={false} 
                        axisLine={false}
                        className="text-xs"
                        domain={[0, 'auto']}
                        allowDataOverflow={false}
                        tickFormatter={(value) => value >= 0 ? value : 0}
                      />
                      {/* Right Y-axis for Accuracy (%) */}
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tickLine={false} 
                        axisLine={false}
                        className="text-xs"
                        domain={[0, 100]}
                        allowDataOverflow={false}
                        tickFormatter={(value) => `${value >= 0 ? value : 0}%`}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(_, payload) => payload[0]?.payload?.date || ''}
                      />
                      <Legend />
                      {/* KPS - Area with line */}
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="kps"
                        name="KPS"
                        baseValue={0}
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        fill="url(#kpsGradient)"
                      />
                      {/* Accuracy - Line */}
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="accuracy"
                        name={t('accuracy')}
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        dot={false}
                      />
                      {/* Words - Line */}
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="correctWords"
                        name={t('words_chart')}
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ChartContainer>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    {t('last_n_games', { count: chartData.length })}
                  </p>
                </Card>
              </motion.div>
            )}

            {/* Keyboard Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Keyboard className="w-5 h-5" />
                  {t('keyboard_heatmap')}
                </h2>
                <KeyboardHeatmap keyStats={keyStats} />
              </Card>
            </motion.div>

            {/* Difficult Transitions */}
            {weakTransitions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-4 sm:p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Warning className="w-5 h-5 text-orange-500" />
                    {t('difficult_transitions')}
                  </h2>
                  <div className="space-y-3">
                    {weakTransitions.map((tr, index) => (
                      <div key={`${tr.fromKey}-${tr.toKey}`} className="flex items-center gap-3">
                        <span className="text-muted-foreground text-sm w-4">{index + 1}.</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="px-2 py-1 bg-secondary rounded text-sm font-bold">
                            {tr.fromKey.toUpperCase()}
                          </span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <span className="px-2 py-1 bg-secondary rounded text-sm font-bold">
                            {tr.toKey.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full transition-all"
                              style={{ width: `${Math.min(tr.errorRate * 100 * 2, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap">
                          <span className="font-semibold text-orange-500">
                            {Math.round(tr.errorRate * 100)}%
                          </span>
                          <span className="text-muted-foreground ml-2">
                            {tr.avgLatency}ms
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Common Mistakes */}
            {confusionPairs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-4 sm:p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Swap className="w-5 h-5 text-red-500" />
                    {t('common_mistakes')}
                  </h2>
                  <div className="space-y-2">
                    {confusionPairs.map((pair, index) => (
                      <div
                        key={`${pair.expected}-${pair.actual}-${index}`}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="text-muted-foreground w-4">{index + 1}.</span>
                        <span className="font-mono px-2 py-1 bg-green-500/10 text-green-700 dark:text-green-400 rounded border border-green-500/20">
                          {pair.expected.toUpperCase()}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-mono px-2 py-1 bg-red-500/10 text-red-700 dark:text-red-400 rounded border border-red-500/20">
                          {pair.actual.toUpperCase()}
                        </span>
                        <span className="text-muted-foreground">:</span>
                        <span className="font-semibold">{pair.count} {t('times')}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Reset Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{t('reset_stats')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('reset_stats_desc')}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onReset}
                    className="gap-2"
                  >
                    <Trash className="w-4 h-4" />
                    {tc('reset')}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
    </Container>
  )
}
