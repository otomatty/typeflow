import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Keyboard, Zap, ArrowRight } from 'lucide-react'
import { Word, PresetWord } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RecommendedPresets } from '@/components/RecommendedPresets'

interface MenuScreenProps {
  words: Word[]
  onStartGame: () => void
  onQuickStart?: () => void
  isFirstTime?: boolean
  gameScoresCount?: number
  onLoadPreset?: (
    words: PresetWord[],
    options?: { clearExisting?: boolean; presetName?: string }
  ) => Promise<unknown>
}

export function MenuScreen({
  words,
  onStartGame: _onStartGame,
  onQuickStart,
  isFirstTime,
  gameScoresCount = 0,
  onLoadPreset,
}: MenuScreenProps) {
  const { t } = useTranslation('menu')
  const { t: tc } = useTranslation('common')
  const canStart = words.length > 0
  const showQuickStart = isFirstTime && words.length === 0 && gameScoresCount === 0
  const showRecommendedPresets = !canStart && !showQuickStart && onLoadPreset

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 w-full max-w-2xl"
      >
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight gradient-text">
            {tc('app_name')}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">{tc('app_tagline')}</p>
        </div>

        {showQuickStart ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-6"
          >
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-semibold">{t('quick_start_title')}</h2>
                </div>
                <p className="text-muted-foreground text-sm">{t('quick_start_description')}</p>
                <Button onClick={onQuickStart} size="lg" className="w-full gap-2">
                  {t('start_skill_check')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground/70">{t('quick_start_note')}</p>
              </div>
            </Card>
          </motion.div>
        ) : canStart ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Keyboard className="w-6 h-6" />
              <span className="text-lg">{t('words_ready', { count: words.length })}</span>
            </div>

            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="pt-8"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-secondary/50 border border-border/50">
                <kbd className="px-3 py-1.5 text-sm font-mono bg-background rounded border border-border shadow-sm">
                  Space
                </kbd>
                <span className="text-muted-foreground">{t('press_to_start')}</span>
              </div>
            </motion.div>
          </motion.div>
        ) : showRecommendedPresets ? (
          <RecommendedPresets onLoadPreset={onLoadPreset!} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-4"
          >
            <p className="text-muted-foreground">{t('no_words_yet')}</p>
            <p className="text-sm text-muted-foreground/60">{t('go_to_words')}</p>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute bottom-8 text-center text-xs text-muted-foreground/50"
      >
        <p>{t('press_esc_to_exit')}</p>
      </motion.div>
    </div>
  )
}
