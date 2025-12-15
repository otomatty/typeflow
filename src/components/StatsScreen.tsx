import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2, Keyboard, ArrowRight, AlertTriangle, ArrowRightLeft, TrendingUp, Calendar, Flame, Trophy } from 'lucide-react'
import { KeyboardHeatmap } from '@/components/KeyboardHeatmap'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Container } from '@/components/Container'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { XAxis, YAxis, CartesianGrid, ComposedChart, Area, Line, Legend, Bar, BarChart, ResponsiveContainer } from 'recharts'
import type { KeyStats, KeyTransitionStats } from '@/lib/types'
import type { GameScoreRecord } from '@/lib/db'

interface StatsScreenProps {
  keyStats: Record<string, KeyStats>
  transitionStats: Record<string, KeyTransitionStats>
  gameScores: GameScoreRecord[]
  onReset: () => void
}

type ChartRangeOption = 30 | 100 | 500
type DailyRangeOption = 7 | 14 | 30

interface DailyStats {
  date: string
  dateLabel: string
  games: number
  totalKeystrokes: number
  totalWords: number
  correctWords: number
  perfectWords: number
  totalTime: number
  avgKps: number
  avgAccuracy: number
}

// Calculate daily statistics from game scores
function calculateDailyStats(gameScores: GameScoreRecord[], locale: string): DailyStats[] {
  const dailyMap = new Map<string, {
    games: number
    totalKeystrokes: number
    totalWords: number
    correctWords: number
    perfectWords: number
    totalTime: number
    kpsSum: number
    accuracySum: number
  }>()

  for (const score of gameScores) {
    const date = new Date(score.playedAt)
    const dateKey = date.toISOString().split('T')[0]
    
    const existing = dailyMap.get(dateKey) || {
      games: 0,
      totalKeystrokes: 0,
      totalWords: 0,
      correctWords: 0,
      perfectWords: 0,
      totalTime: 0,
      kpsSum: 0,
      accuracySum: 0,
    }
    
    existing.games++
    existing.totalKeystrokes += score.totalKeystrokes
    existing.totalWords += score.totalWords
    existing.correctWords += score.correctWords
    existing.perfectWords += score.perfectWords
    existing.totalTime += score.totalTime
    existing.kpsSum += score.kps
    existing.accuracySum += score.accuracy
    
    dailyMap.set(dateKey, existing)
  }

  const localeCode = locale?.startsWith('ja') ? 'ja-JP' : 'en-US'
  
  return Array.from(dailyMap.entries())
    .map(([date, stats]) => ({
      date,
      dateLabel: new Date(date).toLocaleDateString(localeCode, {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      }),
      games: stats.games,
      totalKeystrokes: stats.totalKeystrokes,
      totalWords: stats.totalWords,
      correctWords: stats.correctWords,
      perfectWords: stats.perfectWords,
      totalTime: stats.totalTime,
      avgKps: Math.round((stats.kpsSum / stats.games) * 10) / 10,
      avgAccuracy: Math.round((stats.accuracySum / stats.games) * 10) / 10,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

// Calculate play streak
function calculateStreak(dailyStats: DailyStats[]): { current: number; best: number } {
  if (dailyStats.length === 0) return { current: 0, best: 0 }
  
  const sortedDates = dailyStats.map(d => d.date).sort((a, b) => b.localeCompare(a))
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  let current = 0
  let best = 0
  let streak = 0
  let prevDate: string | null = null
  
  // Check if streak is active (played today or yesterday)
  const isStreakActive = sortedDates[0] === today || sortedDates[0] === yesterday
  
  for (const date of sortedDates) {
    if (prevDate === null) {
      streak = 1
    } else {
      const prev = new Date(prevDate)
      const curr = new Date(date)
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000)
      
      if (diffDays === 1) {
        streak++
      } else {
        best = Math.max(best, streak)
        streak = 1
      }
    }
    prevDate = date
  }
  
  best = Math.max(best, streak)
  current = isStreakActive ? streak : 0
  
  // Recalculate current streak from today/yesterday
  if (isStreakActive) {
    current = 0
    let checkDate = sortedDates[0] === today ? today : yesterday
    for (const date of sortedDates) {
      if (date === checkDate) {
        current++
        const d = new Date(checkDate)
        d.setDate(d.getDate() - 1)
        checkDate = d.toISOString().split('T')[0]
      } else if (date < checkDate) {
        break
      }
    }
  }
  
  return { current, best }
}

// Format time duration
function formatDuration(seconds: number, t: (key: string) => string): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (mins > 0) {
    return `${mins}${t('minutes')} ${secs}${t('seconds')}`
  }
  return `${secs}${t('seconds')}`
}

export function StatsScreen({ keyStats, transitionStats, gameScores, onReset }: StatsScreenProps) {
  const { t, i18n } = useTranslation('stats')
  const { t: tc } = useTranslation('common')
  const [chartRange, setChartRange] = useState<ChartRangeOption>(30)
  const [dailyRange, setDailyRange] = useState<DailyRangeOption>(14)
  const [activeTab, setActiveTab] = useState<string>('overview')

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

  // Calculate daily statistics
  const dailyStats = useMemo(() => {
    return calculateDailyStats(gameScores, i18n.language)
  }, [gameScores, i18n.language])

  // Calculate streak
  const streak = useMemo(() => {
    return calculateStreak(dailyStats)
  }, [dailyStats])

  // Daily summary for the selected period
  const dailySummary = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - now.getDay())
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const todayStats = dailyStats.find(d => d.date === today)
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const yesterdayStats = dailyStats.find(d => d.date === yesterdayDate)
    
    const weekStats = dailyStats.filter(d => new Date(d.date) >= thisWeekStart)
    const monthStats = dailyStats.filter(d => new Date(d.date) >= thisMonthStart)
    
    const sumStats = (stats: DailyStats[]) => ({
      games: stats.reduce((sum, d) => sum + d.games, 0),
      totalTime: stats.reduce((sum, d) => sum + d.totalTime, 0),
      totalWords: stats.reduce((sum, d) => sum + d.totalWords, 0),
      avgKps: stats.length > 0 
        ? Math.round((stats.reduce((sum, d) => sum + d.avgKps, 0) / stats.length) * 10) / 10 
        : 0,
      avgAccuracy: stats.length > 0 
        ? Math.round((stats.reduce((sum, d) => sum + d.avgAccuracy, 0) / stats.length) * 10) / 10 
        : 0,
    })
    
    // Find best days
    const bestKpsDay = dailyStats.length > 0 
      ? dailyStats.reduce((best, d) => d.avgKps > best.avgKps ? d : best)
      : null
    const bestAccuracyDay = dailyStats.length > 0
      ? dailyStats.reduce((best, d) => d.avgAccuracy > best.avgAccuracy ? d : best)
      : null
    
    return {
      today: todayStats,
      yesterday: yesterdayStats,
      thisWeek: sumStats(weekStats),
      thisMonth: sumStats(monthStats),
      bestKpsDay,
      bestAccuracyDay,
    }
  }, [dailyStats])

  // Prepare chart data for daily trend
  const dailyChartData = useMemo(() => {
    return [...dailyStats]
      .slice(0, dailyRange)
      .reverse()
      .map(d => ({
        date: d.dateLabel,
        fullDate: d.date,
        games: d.games,
        avgKps: d.avgKps,
        avgAccuracy: d.avgAccuracy,
        totalWords: d.totalWords,
      }))
  }, [dailyStats, dailyRange])

  // Daily chart configuration
  const dailyChartConfig: ChartConfig = {
    games: {
      label: t('games_played'),
      color: 'hsl(var(--chart-4))',
    },
    avgKps: {
      label: t('avg_kps'),
      color: 'hsl(var(--chart-1))',
    },
    avgAccuracy: {
      label: t('accuracy'),
      color: 'hsl(var(--chart-2))',
    },
  }

  // Prepare chart data (選択された件数を古い順に並べる、マイナス値は0に変換)
  const chartData = useMemo(() => {
    const scores = [...gameScores].reverse().slice(-chartRange)
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
  }, [gameScores, i18n.language, chartRange])

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
  const hasDailyData = dailyStats.length > 0

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-[300px]">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('tab_overview')}
            </TabsTrigger>
            <TabsTrigger value="daily" className="gap-2">
              <Calendar className="w-4 h-4" />
              {t('tab_daily')}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
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
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      {t('performance_history')}
                    </h2>
                    <Select
                      value={String(chartRange)}
                      onValueChange={(value) => setChartRange(Number(value) as ChartRangeOption)}
                    >
                      <SelectTrigger className="w-[140px]" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">{t('last_n_games', { count: 30 })}</SelectItem>
                        <SelectItem value="100">{t('last_n_games', { count: 100 })}</SelectItem>
                        <SelectItem value="500">{t('last_n_games', { count: 500 })}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  {chartData.length < chartRange && chartData.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      {t('showing_games', { showing: chartData.length, total: chartRange })}
                    </p>
                  )}
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
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
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
                    <ArrowRightLeft className="w-5 h-5 text-red-500" />
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
          </TabsContent>

          {/* Daily Stats Tab */}
          <TabsContent value="daily" className="space-y-6">
            {!hasDailyData ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold mb-2">{t('no_daily_data')}</h2>
                  <p className="text-muted-foreground text-sm">
                    {t('no_daily_data_desc')}
                  </p>
                </Card>
              </motion.div>
            ) : (
              <>
                {/* Streak Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="p-4 sm:p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Flame className={`w-6 h-6 ${streak.current > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div className={`text-3xl sm:text-4xl font-bold ${streak.current > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                          {streak.current}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase mt-1">
                          {t('current_streak')} ({t('days')})
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Trophy className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold text-yellow-500">
                          {streak.best}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase mt-1">
                          {t('best_streak')} ({t('days')})
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Period Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    {/* Today */}
                    <Card className="p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('today')}</h3>
                      {dailySummary.today ? (
                        <div className="space-y-1">
                          <div className="text-2xl font-bold">{dailySummary.today.games} {t('games_played')}</div>
                          <div className="text-sm text-muted-foreground">
                            KPS: {dailySummary.today.avgKps} · {t('accuracy')}: {dailySummary.today.avgAccuracy}%
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm">—</div>
                      )}
                    </Card>

                    {/* Yesterday */}
                    <Card className="p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('yesterday')}</h3>
                      {dailySummary.yesterday ? (
                        <div className="space-y-1">
                          <div className="text-2xl font-bold">{dailySummary.yesterday.games} {t('games_played')}</div>
                          <div className="text-sm text-muted-foreground">
                            KPS: {dailySummary.yesterday.avgKps} · {t('accuracy')}: {dailySummary.yesterday.avgAccuracy}%
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm">—</div>
                      )}
                    </Card>

                    {/* This Week */}
                    <Card className="p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('this_week')}</h3>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold">{dailySummary.thisWeek.games} {t('games_played')}</div>
                        <div className="text-sm text-muted-foreground">
                          {dailySummary.thisWeek.totalWords} {t('total_words')} · {formatDuration(dailySummary.thisWeek.totalTime, t)}
                        </div>
                      </div>
                    </Card>

                    {/* This Month */}
                    <Card className="p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('this_month')}</h3>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold">{dailySummary.thisMonth.games} {t('games_played')}</div>
                        <div className="text-sm text-muted-foreground">
                          {dailySummary.thisMonth.totalWords} {t('total_words')} · {formatDuration(dailySummary.thisMonth.totalTime, t)}
                        </div>
                      </div>
                    </Card>
                  </div>
                </motion.div>

                {/* Best Records */}
                {(dailySummary.bestKpsDay || dailySummary.bestAccuracyDay) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="p-4 sm:p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Best Records
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {dailySummary.bestKpsDay && (
                          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                            <div>
                              <div className="text-sm text-muted-foreground">{t('best_day_kps')}</div>
                              <div className="font-medium">{dailySummary.bestKpsDay.dateLabel}</div>
                            </div>
                            <div className="text-2xl font-bold text-primary">{dailySummary.bestKpsDay.avgKps}</div>
                          </div>
                        )}
                        {dailySummary.bestAccuracyDay && (
                          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                            <div>
                              <div className="text-sm text-muted-foreground">{t('best_day_accuracy')}</div>
                              <div className="font-medium">{dailySummary.bestAccuracyDay.dateLabel}</div>
                            </div>
                            <div className="text-2xl font-bold text-primary">{dailySummary.bestAccuracyDay.avgAccuracy}%</div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Daily Trend Chart */}
                {dailyChartData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Card className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          {t('daily_trend')}
                        </h2>
                        <Select
                          value={String(dailyRange)}
                          onValueChange={(value) => setDailyRange(Number(value) as DailyRangeOption)}
                        >
                          <SelectTrigger className="w-[140px]" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">{t('last_n_days', { count: 7 })}</SelectItem>
                            <SelectItem value="14">{t('last_n_days', { count: 14 })}</SelectItem>
                            <SelectItem value="30">{t('last_n_days', { count: 30 })}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <ChartContainer config={dailyChartConfig} className="h-[300px] w-full">
                        <ComposedChart data={dailyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gamesGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                          <XAxis 
                            dataKey="date" 
                            tickLine={false} 
                            axisLine={false}
                            className="text-xs"
                          />
                          <YAxis 
                            yAxisId="left"
                            tickLine={false} 
                            axisLine={false}
                            className="text-xs"
                            domain={[0, 'auto']}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            tickLine={false} 
                            axisLine={false}
                            className="text-xs"
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <ChartTooltip 
                            content={<ChartTooltipContent />}
                          />
                          <Legend />
                          <Bar
                            yAxisId="left"
                            dataKey="games"
                            name={t('games_played')}
                            fill="hsl(var(--chart-4))"
                            radius={[4, 4, 0, 0]}
                            opacity={0.7}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="avgKps"
                            name={t('avg_kps')}
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 0, r: 3 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="avgAccuracy"
                            name={t('accuracy')}
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 0, r: 3 }}
                          />
                        </ComposedChart>
                      </ChartContainer>
                    </Card>
                  </motion.div>
                )}

                {/* Daily Stats Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="p-4 sm:p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {t('daily_stats_title')}
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">{t('date')}</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t('games_played')}</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t('total_words')}</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t('avg_kps')}</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t('accuracy')}</th>
                            <th className="text-right py-2 px-2 font-medium text-muted-foreground">{t('total_time')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyStats.slice(0, 14).map((day, index) => (
                            <tr 
                              key={day.date} 
                              className={`border-b border-border/50 ${index === 0 ? 'bg-primary/5' : ''}`}
                            >
                              <td className="py-2 px-2 font-medium">{day.dateLabel}</td>
                              <td className="text-right py-2 px-2">{day.games}</td>
                              <td className="text-right py-2 px-2">{day.totalWords}</td>
                              <td className="text-right py-2 px-2 font-semibold text-primary">{day.avgKps}</td>
                              <td className="text-right py-2 px-2">{day.avgAccuracy}%</td>
                              <td className="text-right py-2 px-2 text-muted-foreground">
                                {formatDuration(day.totalTime, t)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              </>
            )}
          </TabsContent>

          {/* Reset Button (shown in both tabs) */}
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
                  <Trash2 className="w-4 h-4" />
                  {tc('reset')}
                </Button>
              </div>
            </Card>
          </motion.div>
        </Tabs>
      )}
    </Container>
  )
}
