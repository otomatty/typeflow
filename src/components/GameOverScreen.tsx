import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Play,
  RotateCcw,
  Timer,
  Target,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Clock,
  Sparkles,
  Crosshair,
} from 'lucide-react'
import {
  GameStats,
  WordPerformanceRecord,
  DifficultyPreset,
  MinimalModeType,
  Word,
} from '@/lib/types'
import { recommendDifficulty, getSkillCheckDescription } from '@/lib/skill-check-utils'
import { getDifficultyLabel } from '@/lib/difficulty-presets'
import { MinimalGameOverScreen } from '@/components/MinimalGameOverScreen'
import { useMinimalMode } from '@/hooks/useMinimalMode'

// ミスが多い単語の閾値
const MISS_COUNT_THRESHOLD = 2

interface GameOverScreenProps {
  stats: GameStats
  hasMistakes: boolean
  onRestart: () => void
  onRetryWeak: () => void
  onExit: () => void
  isQuickStartMode?: boolean
  onApplyRecommendedDifficulty?: (difficulty: DifficultyPreset) => void
  minimalMode?: MinimalModeType
  minimalModeBreakpoint?: number
  words?: Word[]
  onStartWordPractice?: (word: Word) => void
}

type SortKey = 'order' | 'reactionTime' | 'missCount' | 'totalTime'
type SortDirection = 'asc' | 'desc'

// 初動時間の閾値（ms）
const REACTION_TIME_FAST = 400
const REACTION_TIME_SLOW = 800

function getReactionTimeColor(reactionTime: number): string {
  if (reactionTime < REACTION_TIME_FAST) return 'text-green-500'
  if (reactionTime < REACTION_TIME_SLOW) return 'text-yellow-500'
  return 'text-red-500'
}

function getReactionTimeBgColor(reactionTime: number): string {
  if (reactionTime < REACTION_TIME_FAST) return 'bg-green-500/10'
  if (reactionTime < REACTION_TIME_SLOW) return 'bg-yellow-500/10'
  return 'bg-red-500/10'
}

// 時間をフォーマット（日本語: 秒、英語: ms）
function formatReactionTime(ms: number, isJapanese: boolean): string {
  if (ms <= 0) return '-'
  if (isJapanese) {
    return `${(ms / 1000).toFixed(2)}秒`
  }
  return `${ms}ms`
}

function formatTotalTime(ms: number, isJapanese: boolean): string {
  const seconds = ms / 1000
  if (isJapanese) {
    return `${seconds.toFixed(1)}秒`
  }
  return `${seconds.toFixed(1)}s`
}

export function GameOverScreen({
  stats,
  hasMistakes,
  onRestart,
  onRetryWeak,
  onExit,
  isQuickStartMode = false,
  onApplyRecommendedDifficulty,
  minimalMode = 'auto',
  minimalModeBreakpoint = 600,
  words = [],
  onStartWordPractice,
}: GameOverScreenProps) {
  const { t, i18n } = useTranslation('game')
  const [sortKey, setSortKey] = useState<SortKey>('order')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const isMinimal = useMinimalMode(minimalMode, minimalModeBreakpoint)

  // 日本語かどうかを判定
  const isJapanese = i18n.language?.startsWith('ja') ?? false

  // スキルチェックモードの場合、難易度を提案
  const recommendedDifficulty = isQuickStartMode ? recommendDifficulty(stats) : null
  const skillCheckDescription = recommendedDifficulty
    ? getSkillCheckDescription(stats, recommendedDifficulty, isJapanese)
    : null

  // 練習を勧める単語（ミスが多い、または時間切れ）
  const wordsNeedingPractice = useMemo(() => {
    return stats.wordPerformances.filter(p => p.missCount >= MISS_COUNT_THRESHOLD || !p.completed)
  }, [stats.wordPerformances])

  // 単語IDからWordオブジェクトを取得
  const getWordById = (wordId: string): Word | undefined => {
    return words.find(w => w.id === wordId)
  }

  // ソートされた単語パフォーマンスリスト（フックは早期リターンの前に呼び出す必要がある）
  const sortedPerformances = useMemo(() => {
    const performances = stats.wordPerformances.map((p, index) => ({ ...p, originalIndex: index }))

    return performances.sort((a, b) => {
      let comparison = 0

      switch (sortKey) {
        case 'order':
          comparison = a.originalIndex - b.originalIndex
          break
        case 'reactionTime':
          comparison = a.reactionTime - b.reactionTime
          break
        case 'missCount':
          comparison = a.missCount - b.missCount
          break
        case 'totalTime':
          comparison = a.totalTime - b.totalTime
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [stats.wordPerformances, sortKey, sortDirection])

  // ミニマルモードの場合はシンプルな画面を表示
  if (isMinimal) {
    return (
      <MinimalGameOverScreen
        stats={stats}
        hasMistakes={hasMistakes}
        onRestart={onRestart}
        onRetryWeak={onRetryWeak}
        onExit={onExit}
        isQuickStartMode={isQuickStartMode}
        onApplyRecommendedDifficulty={onApplyRecommendedDifficulty}
      />
    )
  }

  const handleApplyRecommended = () => {
    if (recommendedDifficulty && onApplyRecommendedDifficulty) {
      onApplyRecommendedDifficulty(recommendedDifficulty)
      onExit()
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection(key === 'order' ? 'asc' : 'desc')
    }
  }

  const SortButton = ({
    sortKeyValue,
    children,
  }: {
    sortKeyValue: SortKey
    children: React.ReactNode
  }) => (
    <button
      onClick={() => handleSort(sortKeyValue)}
      className={`flex items-center gap-1 text-xs font-medium transition-colors hover:text-primary ${
        sortKey === sortKeyValue ? 'text-primary' : 'text-muted-foreground'
      }`}
    >
      {children}
      {sortKey === sortKeyValue &&
        (sortDirection === 'asc' ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        ))}
    </button>
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center min-h-screen p-4"
    >
      <Card className="w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <div className="text-center shrink-0 pb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {isQuickStartMode ? t('skill_check_complete') : t('game_over')}
          </h2>
          <p className="text-muted-foreground">{t('great_session')}</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-3xl sm:text-4xl font-bold text-primary">{stats.kps}</div>
                <div className="text-xs sm:text-sm text-muted-foreground uppercase mt-1">
                  {t('keys_per_sec')}
                </div>
              </div>

              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className="text-3xl sm:text-4xl font-bold text-primary">{stats.accuracy}%</div>
                <div className="text-xs sm:text-sm text-muted-foreground uppercase mt-1">
                  {t('accuracy')}
                </div>
              </div>
            </div>

            {/* First Key Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Timer className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-bold">
                    {formatReactionTime(stats.avgReactionTime, isJapanese)}
                  </div>
                  <div className="text-xs text-muted-foreground">{t('avg_reaction_time')}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-bold">{stats.firstKeyAccuracy}%</div>
                  <div className="text-xs text-muted-foreground">{t('first_key_accuracy')}</div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="space-y-2 text-sm text-center">
              <div className="flex justify-between px-4">
                <span className="text-muted-foreground">{t('total_keystrokes')}:</span>
                <span className="font-bold">{stats.totalKeystrokes}</span>
              </div>
              <div className="flex justify-between px-4">
                <span className="text-muted-foreground">{t('successful_words')}:</span>
                <span className="font-bold">
                  {stats.successfulWords} / {stats.completedWords}
                </span>
              </div>
              <div className="flex justify-between px-4">
                <span className="text-muted-foreground">{t('total_time')}:</span>
                <span className="font-bold">
                  {isJapanese
                    ? `${Math.round(stats.totalTime)}秒`
                    : `${Math.round(stats.totalTime)}s`}
                </span>
              </div>
            </div>

            {/* Word Performance Table */}
            {stats.wordPerformances.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t('word_performance')}
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_80px_80px_70px_60px_50px] gap-2 px-3 py-2 bg-muted/50 border-b text-xs">
                    <SortButton sortKeyValue="order">{t('word')}</SortButton>
                    <SortButton sortKeyValue="reactionTime">{t('reaction')}</SortButton>
                    <SortButton sortKeyValue="totalTime">{t('time')}</SortButton>
                    <SortButton sortKeyValue="missCount">{t('miss')}</SortButton>
                    <span className="text-muted-foreground font-medium">{t('first_key')}</span>
                    <span className="text-muted-foreground font-medium text-center">
                      {t('practice_short', { defaultValue: '練習' })}
                    </span>
                  </div>

                  {/* Table Body - no longer needs internal ScrollArea */}
                  <div className="divide-y">
                    {sortedPerformances.map((perf, index) => (
                      <WordPerformanceRow
                        key={`${perf.wordId}-${index}`}
                        performance={perf}
                        t={t}
                        isJapanese={isJapanese}
                        word={getWordById(perf.wordId)}
                        onStartWordPractice={onStartWordPractice}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 練習を勧めるセクション */}
            {wordsNeedingPractice.length > 0 && onStartWordPractice && (
              <div>
                <Card className="p-4 bg-orange-500/5 border-orange-500/20">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Crosshair className="w-5 h-5 text-orange-500" />
                      <h3 className="font-semibold text-orange-600 dark:text-orange-400">
                        {t('practice_recommended', { defaultValue: '集中練習がおすすめ' })}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('practice_recommended_desc', {
                        defaultValue: '以下の単語でミスが多かったです。集中練習で克服しましょう！',
                      })}
                    </p>
                    <div className="space-y-2">
                      {wordsNeedingPractice.slice(0, 5).map(perf => {
                        const word = getWordById(perf.wordId)
                        if (!word) return null
                        return (
                          <div
                            key={perf.wordId}
                            className="flex items-center justify-between p-2 bg-background rounded-lg border"
                          >
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-medium truncate">{perf.wordText}</span>
                              <span className="text-xs text-muted-foreground truncate">
                                {perf.reading}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {!perf.completed && (
                                <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                                  {t('timeout', { defaultValue: '時間切れ' })}
                                </span>
                              )}
                              {perf.missCount > 0 && (
                                <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                                  {perf.missCount} {t('miss_count_label', { defaultValue: 'ミス' })}
                                </span>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onStartWordPractice(word)}
                                className="gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-500/10 border-orange-500/30"
                              >
                                <Target className="w-3 h-3" />
                                {t('start_practice', { defaultValue: '練習' })}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {wordsNeedingPractice.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        {t('and_more_words', {
                          count: wordsNeedingPractice.length - 5,
                          defaultValue: `他 ${wordsNeedingPractice.length - 5} 件`,
                        })}
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Skill Check Recommendation */}
        {isQuickStartMode && recommendedDifficulty && (
          <div className="mb-6">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">{t('recommended_difficulty')}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t('recommended_difficulty')}:</span>
                    <span className="text-sm font-bold text-primary">
                      {recommendedDifficulty ? getDifficultyLabel(recommendedDifficulty) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {skillCheckDescription}
                  </p>
                </div>
                <Button onClick={handleApplyRecommended} className="w-full gap-2" size="sm">
                  {t('apply_recommended')}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Fixed Footer - Action Buttons */}
        <div className="space-y-2 pt-6 shrink-0">
          {hasMistakes && !isQuickStartMode ? (
            // 間違った問題がある時は復習するボタンのみ表示
            <Button onClick={onRetryWeak} className="w-full gap-2">
              <RotateCcw className="w-4 h-4" />
              {t('retry_weak_words')}
              <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-background/50 rounded border border-border/50">
                Space
              </kbd>
            </Button>
          ) : !isQuickStartMode ? (
            // ミスなくタイピングできたら新しい問題に挑戦するボタンのみ表示
            <Button onClick={onRestart} variant="secondary" className="w-full gap-2">
              <Play className="w-4 h-4" />
              {t('play_again')}
              <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-background/50 rounded border border-border/50">
                Space
              </kbd>
            </Button>
          ) : null}

          <Button onClick={onExit} variant="outline" className="w-full gap-2">
            {isQuickStartMode ? t('select_preset') : t('back_to_menu')}
            <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-background/50 rounded border border-border/50">
              Esc
            </kbd>
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

interface WordPerformanceRowProps {
  performance: WordPerformanceRecord & { originalIndex: number }
  t: (key: string) => string
  isJapanese: boolean
  word?: Word
  onStartWordPractice?: (word: Word) => void
}

function WordPerformanceRow({
  performance,
  t,
  isJapanese,
  word,
  onStartWordPractice,
}: WordPerformanceRowProps) {
  const reactionTimeColor = getReactionTimeColor(performance.reactionTime)
  const reactionTimeBg = getReactionTimeBgColor(performance.reactionTime)
  // 失敗した単語（ミスありまたは時間切れ）は赤く表示
  const isFailed = performance.result === 'failed'

  return (
    <div
      className={`grid grid-cols-[1fr_80px_80px_70px_60px_50px] gap-2 px-3 py-2 text-sm items-center ${
        isFailed ? 'bg-red-500/5' : ''
      }`}
    >
      {/* Word */}
      <div className="flex flex-col min-w-0">
        <span className="font-medium truncate">{performance.wordText}</span>
        <span className="text-xs text-muted-foreground truncate">{performance.reading}</span>
      </div>

      {/* Reaction Time */}
      <div className={`text-center rounded px-2 py-0.5 ${reactionTimeBg}`}>
        <span className={`font-mono text-xs font-medium ${reactionTimeColor}`}>
          {formatReactionTime(performance.reactionTime, isJapanese)}
        </span>
      </div>

      {/* Total Time */}
      <div className="text-center">
        <span className="font-mono text-xs text-muted-foreground">
          {performance.completed ? (
            formatTotalTime(performance.totalTime, isJapanese)
          ) : (
            <span className="text-red-500">{t('timeout')}</span>
          )}
        </span>
      </div>

      {/* Miss Count */}
      <div className="text-center">
        <span
          className={`font-mono text-xs font-medium ${
            performance.missCount === 0 ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {performance.missCount}
        </span>
      </div>

      {/* First Key Correct */}
      <div className="flex justify-center">
        {performance.firstKeyExpected ? (
          performance.firstKeyCorrect ? (
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" />
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-500">
              <X className="w-4 h-4" />
              <span className="text-xs font-mono">{performance.firstKeyActual.toUpperCase()}</span>
            </div>
          )
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>

      {/* Practice Button */}
      <div className="flex justify-center">
        {word && onStartWordPractice ? (
          <button
            onClick={() => onStartWordPractice(word)}
            className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title={t('start_practice')}
          >
            <Target className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    </div>
  )
}
