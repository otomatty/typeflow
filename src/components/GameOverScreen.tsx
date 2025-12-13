import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('game')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center min-h-screen p-4"
    >
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t('game_over')}</h2>
          <p className="text-muted-foreground">{t('great_session')}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-3xl sm:text-4xl font-bold text-primary">{stats.kps}</div>
            <div className="text-xs sm:text-sm text-muted-foreground uppercase mt-1">{t('keys_per_sec')}</div>
          </div>
          
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-3xl sm:text-4xl font-bold text-primary">{stats.accuracy}%</div>
            <div className="text-xs sm:text-sm text-muted-foreground uppercase mt-1">{t('accuracy')}</div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-center">
          <div className="flex justify-between px-4">
            <span className="text-muted-foreground">{t('total_keystrokes')}:</span>
            <span className="font-bold">{stats.totalKeystrokes}</span>
          </div>
          <div className="flex justify-between px-4">
            <span className="text-muted-foreground">{t('perfect_words')}:</span>
            <span className="font-bold">{stats.perfectWords} / {stats.correctWords}</span>
          </div>
          <div className="flex justify-between px-4">
            <span className="text-muted-foreground">{t('total_time')}:</span>
            <span className="font-bold">{Math.round(stats.totalTime)}s</span>
          </div>
        </div>

        <div className="space-y-2">
          {hasMistakes && (
            <Button onClick={onRetryWeak} className="w-full gap-2">
              <ArrowCounterClockwise weight="bold" />
              {t('retry_weak_words')}
              <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-background/50 rounded border border-border/50">R</kbd>
            </Button>
          )}
          
          <Button onClick={onRestart} variant="secondary" className="w-full gap-2">
            <Play weight="fill" />
            {t('play_again')}
            <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-background/50 rounded border border-border/50">Enter</kbd>
          </Button>
          
          <Button onClick={onExit} variant="outline" className="w-full gap-2">
            {t('back_to_menu')}
            <kbd className="ml-auto px-1.5 py-0.5 text-xs bg-background/50 rounded border border-border/50">Esc</kbd>
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
