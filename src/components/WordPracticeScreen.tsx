import { useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Word, WordPracticePhase, AppSettings } from '@/lib/types'
import { GameScoreRecord } from '@/lib/db'
import { useWordPractice } from '@/hooks/useWordPractice'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Kbd } from '@/components/ui/kbd'
import { Check, X, Clock, Target, Zap, Trophy, ArrowLeft } from 'lucide-react'

interface WordPracticeScreenProps {
  word: Word
  onExit: () => void
  updateWordStats?: (wordId: string, correct: boolean) => void
  gameScores?: GameScoreRecord[]
  settings?: AppSettings
}

// フェーズの表示情報
const PHASE_INFO: Record<
  WordPracticePhase,
  { icon: React.ReactNode; label: string; description: string; color: string }
> = {
  accuracy: {
    icon: <Target className="w-5 h-5" />,
    label: 'Phase 1',
    description: '正確性',
    color: 'text-blue-500',
  },
  speed: {
    icon: <Zap className="w-5 h-5" />,
    label: 'Phase 2',
    description: 'スピード',
    color: 'text-yellow-500',
  },
  mastery: {
    icon: <Trophy className="w-5 h-5" />,
    label: 'Phase 3',
    description: 'マスター',
    color: 'text-green-500',
  },
}

export function WordPracticeScreen({
  word,
  onExit,
  updateWordStats,
  gameScores = [],
  settings,
}: WordPracticeScreenProps) {
  const { t } = useTranslation('practice')

  const { state, stats, showError, startPractice, endPractice, isComplete } = useWordPractice({
    updateWordStats,
    onComplete: () => {
      // マスター完了時の処理
    },
    onExit,
    gameScores,
    settings,
  })

  // 終了ハンドラー
  const handleExit = useCallback(() => {
    endPractice()
    onExit()
  }, [endPractice, onExit])

  // 完了画面でEscキーを押したときに戻る
  useEffect(() => {
    if (!isComplete) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isComplete, onExit])

  // 練習を開始
  useEffect(() => {
    startPractice(word)
    return () => {
      // クリーンアップ
    }
  }, [word, startPractice])

  // 完了画面
  if (isComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 text-green-500">
            <Trophy className="w-12 h-12" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t('mastered', { defaultValue: 'マスター達成！' })}
            </h1>
            <p className="text-muted-foreground">
              {word.text} ({word.reading})
            </p>
          </div>

          <Card className="p-6 space-y-4 max-w-sm mx-auto">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{stats.totalAttempts}</div>
                <div className="text-xs text-muted-foreground uppercase">
                  {t('total_attempts', { defaultValue: '総試行回数' })}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">{stats.successCount}</div>
                <div className="text-xs text-muted-foreground uppercase">
                  {t('success_count', { defaultValue: '成功回数' })}
                </div>
              </div>
              {stats.bestTime && stats.bestTime > 0 && (
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {(word.romaji.length / (stats.bestTime / 1000)).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">
                    {t('best_kps', { defaultValue: '最速KPS' })}
                  </div>
                </div>
              )}
              {stats.averageTime && stats.averageTime > 0 && (
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {(word.romaji.length / (stats.averageTime / 1000)).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">
                    {t('avg_kps', { defaultValue: '平均KPS' })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Button onClick={onExit} size="lg" className="gap-2 pr-2">
            <ArrowLeft className="w-4 h-4" />
            {t('back', { defaultValue: '戻る' })}
            <Kbd>Esc</Kbd>
          </Button>
        </motion.div>
      </div>
    )
  }

  // 練習中
  if (!state.isActive || !state.word) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">
          {t('loading', { defaultValue: '読み込み中...' })}
        </div>
      </div>
    )
  }

  const phaseInfo = PHASE_INFO[state.phase]
  const progressPercent = (state.consecutiveSuccess / state.targetConsecutive) * 100

  // 入力済み部分のみ表示（残り部分は非表示）
  const inputPart = state.currentInput

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <Button variant="ghost" size="sm" onClick={handleExit} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t('exit', { defaultValue: '終了' })}</span>
        </Button>

        <div className={`flex items-center gap-2 ${phaseInfo.color}`}>
          {phaseInfo.icon}
          <span className="font-semibold">{phaseInfo.label}</span>
          <span className="text-muted-foreground">-</span>
          <span>{phaseInfo.description}</span>
        </div>

        <div className="text-sm text-muted-foreground">
          {t('attempts', { defaultValue: '試行' })}: {stats.totalAttempts}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-8">
          {/* 連続成功カウンター */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('consecutive_success', { defaultValue: '連続成功' })}
              </span>
              <span className="font-semibold">
                {state.consecutiveSuccess} / {state.targetConsecutive}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-center gap-1">
              {Array.from({ length: state.targetConsecutive }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < state.consecutiveSuccess ? 'bg-green-500' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* タイムゲージ（速度・マスターフェーズ） */}
          {state.timeRemaining !== null && state.timeLimit !== null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{t('time_remaining', { defaultValue: '残り時間' })}</span>
                </div>
                <span className="font-mono font-semibold tabular-nums">
                  {state.timeRemaining.toFixed(1)}s
                </span>
              </div>
              <Progress
                value={(state.timeRemaining / state.timeLimit) * 100}
                className={`h-2 ${
                  state.timeRemaining < state.timeLimit * 0.3
                    ? '[&>div]:bg-red-500'
                    : state.timeRemaining < state.timeLimit * 0.6
                      ? '[&>div]:bg-yellow-500'
                      : ''
                }`}
              />
            </div>
          )}

          {/* タイピング表示 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={state.attemptCount}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={`p-6 text-center transition-colors ${
                  showError ? 'bg-destructive/10 border-destructive/50' : ''
                }`}
              >
                {/* 日本語表示 */}
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-center tracking-tight">
                  {state.word.text}
                </div>
                <div className="text-sm sm:text-base text-muted-foreground text-center mt-2">
                  {state.word.reading}
                </div>

                {/* ローマ字表示 */}
                <div className="text-base sm:text-lg md:text-xl font-medium tracking-wider mt-4">
                  <span className="text-primary">{inputPart}</span>
                  <span className="inline-block w-0.5 h-4 bg-primary animate-pulse mx-0.5 align-middle" />
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* 統計表示 */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            {stats.bestTime && stats.bestTime > 0 && state.word && (
              <div className="flex items-center gap-1">
                <span>{t('best_kps_short', { defaultValue: '最速' })}:</span>
                <span className="font-mono font-semibold text-foreground">
                  {(state.word.romaji.length / (stats.bestTime / 1000)).toFixed(1)} KPS
                </span>
              </div>
            )}
            {stats.averageTime && stats.averageTime > 0 && state.word && (
              <div className="flex items-center gap-1">
                <span>{t('avg_kps_short', { defaultValue: '平均' })}:</span>
                <span className="font-mono font-semibold text-foreground">
                  {(state.word.romaji.length / (stats.averageTime / 1000)).toFixed(1)} KPS
                </span>
              </div>
            )}
          </div>

          {/* 直近の試行結果 */}
          {stats.attempts.length > 0 && (
            <div className="flex items-center justify-center gap-2">
              {stats.attempts.slice(-10).map((attempt, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    attempt.success
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {attempt.success ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* フッター */}
      <div className="p-4 text-center text-xs text-muted-foreground">
        <kbd className="px-2 py-1 bg-muted rounded text-muted-foreground">Esc</kbd>
        <span className="ml-2">{t('press_esc_to_exit', { defaultValue: 'で終了' })}</span>
      </div>
    </div>
  )
}
