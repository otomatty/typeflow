import { useTranslation } from 'react-i18next'
import { GameStats, DifficultyPreset } from '@/lib/types'

interface MinimalGameOverScreenProps {
  stats: GameStats
  hasMistakes: boolean
  onRestart: () => void
  onRetryWeak: () => void
  onExit: () => void
  isQuickStartMode?: boolean
  onApplyRecommendedDifficulty?: (difficulty: DifficultyPreset) => void
}

/**
 * ミニマルモード用のゲーム終了画面
 * 仕事中でも目立たないシンプルなテキストエディタ風UI
 * - アニメーションなし
 * - 派手な装飾なし
 * - 統計は最小限
 */
export function MinimalGameOverScreen({
  stats,
  hasMistakes,
  onRestart,
  onRetryWeak,
  onExit,
  isQuickStartMode = false,
}: MinimalGameOverScreenProps) {
  const { t, i18n } = useTranslation('game')
  const isJapanese = i18n.language?.startsWith('ja') ?? false

  // 時間をフォーマット
  const formatTime = (ms: number): string => {
    if (ms <= 0) return '-'
    if (isJapanese) {
      return `${(ms / 1000).toFixed(2)}秒`
    }
    return `${ms}ms`
  }

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 font-mono">
      {/* メインコンテンツ（中央配置） */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          {/* タイトル（コメント風） */}
          <div className="text-muted-foreground/40 text-xs">
            // {isQuickStartMode ? t('skill_check_complete') : t('game_over')}
          </div>

          {/* メイン統計（テキストエディタ風） */}
          <div className="bg-background border border-border/30 rounded p-4 space-y-2">
            {/* KPS */}
            <div className="flex items-baseline">
              <span className="text-muted-foreground/40 select-none mr-2">&gt;</span>
              <span className="text-muted-foreground/60 mr-2">kps:</span>
              <span className="text-primary font-bold">{stats.kps}</span>
            </div>

            {/* 正確率 */}
            <div className="flex items-baseline">
              <span className="text-muted-foreground/40 select-none mr-2">&gt;</span>
              <span className="text-muted-foreground/60 mr-2">acc:</span>
              <span className="text-primary font-bold">{stats.accuracy}%</span>
            </div>

            {/* 平均初動時間 */}
            <div className="flex items-baseline">
              <span className="text-muted-foreground/40 select-none mr-2">&gt;</span>
              <span className="text-muted-foreground/60 mr-2">rt:</span>
              <span className="text-muted-foreground">{formatTime(stats.avgReactionTime)}</span>
            </div>

            {/* 単語数 */}
            <div className="flex items-baseline">
              <span className="text-muted-foreground/40 select-none mr-2">&gt;</span>
              <span className="text-muted-foreground/60 mr-2">words:</span>
              <span className="text-muted-foreground">
                {stats.successfulWords}/{stats.completedWords}
              </span>
            </div>

            {/* 総時間 */}
            <div className="flex items-baseline">
              <span className="text-muted-foreground/40 select-none mr-2">&gt;</span>
              <span className="text-muted-foreground/60 mr-2">time:</span>
              <span className="text-muted-foreground">
                {isJapanese
                  ? `${Math.round(stats.totalTime)}秒`
                  : `${Math.round(stats.totalTime)}s`}
              </span>
            </div>
          </div>

          {/* アクションボタン（テキストベース） */}
          <div className="space-y-1 text-sm">
            {hasMistakes && !isQuickStartMode ? (
              <button
                onClick={onRetryWeak}
                className="w-full text-left px-3 py-2 rounded hover:bg-muted/50 transition-colors flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <span className="text-muted-foreground/40">[space]</span>
                <span>{t('retry_weak_words')}</span>
              </button>
            ) : !isQuickStartMode ? (
              <button
                onClick={onRestart}
                className="w-full text-left px-3 py-2 rounded hover:bg-muted/50 transition-colors flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <span className="text-muted-foreground/40">[space]</span>
                <span>{t('play_again')}</span>
              </button>
            ) : null}

            <button
              onClick={onExit}
              className="w-full text-left px-3 py-2 rounded hover:bg-muted/50 transition-colors flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <span className="text-muted-foreground/40">[esc]</span>
              <span>{isQuickStartMode ? t('select_preset') : t('back_to_menu')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* フッター（控えめ） */}
      <div className="text-center text-[9px] text-muted-foreground/20 mt-1 font-mono">
        {t('great_session')}
      </div>
    </div>
  )
}
