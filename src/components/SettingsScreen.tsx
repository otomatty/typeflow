import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Container } from '@/components/Container'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Check, Target, Shuffle, History, Gauge, Flame, Trophy, Skull, Globe, ArrowRight, TrendingUp } from 'lucide-react'
import { WordCountPreset, ThemeType, PracticeMode, DifficultyPreset } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getKpsStatus, getTargetKpsInfo, calculateTimeLimitExample } from '@/lib/adaptive-time-utils'
import { generatePenaltyPreview, DIFFICULTY_PRESETS } from '@/lib/difficulty-presets'
import { GameScoreRecord } from '@/lib/db'

interface SettingsScreenProps {
  wordCount: WordCountPreset
  theme: ThemeType
  practiceMode: PracticeMode
  srsEnabled: boolean
  warmupEnabled: boolean
  // 難易度設定
  difficultyPreset: DifficultyPreset
  // 制限時間設定
  minTimeLimit: number
  maxTimeLimit: number
  gameScores: GameScoreRecord[]
  onWordCountChange: (value: WordCountPreset) => void
  onThemeChange: (value: ThemeType) => void
  onPracticeModeChange: (value: PracticeMode) => void
  onSrsEnabledChange: (value: boolean) => void
  onWarmupEnabledChange: (value: boolean) => void
  // 難易度設定のコールバック
  onDifficultyPresetChange: (value: DifficultyPreset) => void
}

const MIN_WORD_COUNT = 5
const MAX_WORD_COUNT = 100
const STEP = 5

export function SettingsScreen({
  wordCount,
  theme,
  practiceMode,
  srsEnabled,
  warmupEnabled,
  difficultyPreset,
  minTimeLimit,
  maxTimeLimit,
  gameScores,
  onWordCountChange,
  onThemeChange,
  onPracticeModeChange,
  onSrsEnabledChange,
  onWarmupEnabledChange,
  onDifficultyPresetChange,
}: SettingsScreenProps) {
  const { t, i18n } = useTranslation('settings')
  
  const isAllWords = wordCount === 'all'
  const sliderValue = typeof wordCount === 'number' ? wordCount : 20
  const kpsStatus = getKpsStatus(gameScores)
  
  // 現在の難易度に応じたパラメータを取得
  const currentDifficultyParams = DIFFICULTY_PRESETS[difficultyPreset]
  
  // 目標KPS情報を取得
  const targetKpsInfo = getTargetKpsInfo(gameScores, currentDifficultyParams.targetKpsMultiplier)
  
  // 制限時間の例（9打鍵の単語「さくらんぼ」を想定）
  const exampleKeystrokeCount = 9
  const timeLimitExample = calculateTimeLimitExample(
    exampleKeystrokeCount,
    kpsStatus.averageKps,
    currentDifficultyParams.targetKpsMultiplier,
    currentDifficultyParams.comfortZoneRatio,
    minTimeLimit,
    maxTimeLimit
  )
  
  // ペナルティプレビュー
  const penaltyPreview = generatePenaltyPreview(currentDifficultyParams, 4)

  // Options with translations
  const THEME_OPTIONS: { value: ThemeType; labelKey: string; descKey: string }[] = [
    { value: 'light', labelKey: 'theme.light', descKey: 'theme.light_desc' },
    { value: 'dark', labelKey: 'theme.dark', descKey: 'theme.dark_desc' },
    { value: 'system', labelKey: 'theme.system', descKey: 'theme.system_desc' },
  ]

  const PRACTICE_MODE_OPTIONS: { 
    value: PracticeMode
    labelKey: string
    descKey: string
    icon: typeof Target
  }[] = [
    { value: 'random', labelKey: 'practice_mode.random', descKey: 'practice_mode.random_desc', icon: Shuffle },
    { value: 'weakness-focus', labelKey: 'practice_mode.weakness', descKey: 'practice_mode.weakness_desc', icon: Target },
    { value: 'review', labelKey: 'practice_mode.review', descKey: 'practice_mode.review_desc', icon: History },
  ]

  const DIFFICULTY_OPTIONS: {
    value: DifficultyPreset
    labelKey: string
    descKey: string
    icon: typeof Flame
    color: string
  }[] = [
    { value: 'easy', labelKey: 'difficulty.easy', descKey: 'difficulty.easy_desc', icon: Target, color: 'text-green-500' },
    { value: 'normal', labelKey: 'difficulty.normal', descKey: 'difficulty.normal_desc', icon: Flame, color: 'text-yellow-500' },
    { value: 'hard', labelKey: 'difficulty.hard', descKey: 'difficulty.hard_desc', icon: Trophy, color: 'text-orange-500' },
    { value: 'expert', labelKey: 'difficulty.expert', descKey: 'difficulty.expert_desc', icon: Skull, color: 'text-red-500' },
  ]

  const handleSliderChange = (values: number[]) => {
    if (!isAllWords && values[0] !== undefined) {
      onWordCountChange(values[0] as WordCountPreset)
    }
  }

  const handleAllWordsToggle = (checked: boolean) => {
    if (checked) {
      onWordCountChange('all')
    } else {
      onWordCountChange(sliderValue as WordCountPreset)
    }
  }

  const changeLanguage = (lang: 'ja' | 'en') => {
    i18n.changeLanguage(lang)
  }

  const currentLanguage = i18n.language?.startsWith('ja') ? 'ja' : 'en'

  return (
    <Container>
      <ScreenHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="mt-8 space-y-6">
        {/* Language Setting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">{t('language.title')}</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('language.description')}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => changeLanguage('ja')}
                  className={cn(
                    'relative p-4 rounded-lg border text-left transition-all',
                    'hover:bg-secondary/80',
                    currentLanguage === 'ja'
                      ? 'bg-primary/10 border-primary'
                      : 'bg-secondary/50 border-border/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇯🇵</span>
                    <span className="font-medium">日本語</span>
                  </div>
                  {currentLanguage === 'ja' && (
                    <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
                  )}
                </button>
                <button
                  onClick={() => changeLanguage('en')}
                  className={cn(
                    'relative p-4 rounded-lg border text-left transition-all',
                    'hover:bg-secondary/80',
                    currentLanguage === 'en'
                      ? 'bg-primary/10 border-primary'
                      : 'bg-secondary/50 border-border/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇺🇸</span>
                    <span className="font-medium">English</span>
                  </div>
                  {currentLanguage === 'en' && (
                    <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
                  )}
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Word Count Setting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">{t('word_count.title')}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('word_count.description')}
                </p>
              </div>

              {/* All Words Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="all-words" className="text-sm font-medium">
                    {t('word_count.use_all')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('word_count.use_all_description')}
                  </p>
                </div>
                <Switch
                  id="all-words"
                  checked={isAllWords}
                  onCheckedChange={handleAllWordsToggle}
                />
              </div>

              {/* Slider */}
              <div className={cn(
                'space-y-4 transition-opacity',
                isAllWords && 'opacity-50 pointer-events-none'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('word_count.select')}</span>
                  <span className="text-2xl font-bold tabular-nums">
                    {sliderValue}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{t('word_count.questions')}</span>
                  </span>
                </div>
                
                <Slider
                  value={[sliderValue]}
                  onValueChange={handleSliderChange}
                  min={MIN_WORD_COUNT}
                  max={MAX_WORD_COUNT}
                  step={STEP}
                  disabled={isAllWords}
                  className="w-full"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{MIN_WORD_COUNT} {t('word_count.questions')}</span>
                  <span>{MAX_WORD_COUNT} {t('word_count.questions')}</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {t('word_count.note')}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Difficulty Preset Setting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">{t('difficulty.title')}</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('difficulty.description')}
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DIFFICULTY_OPTIONS.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => onDifficultyPresetChange(option.value)}
                      className={cn(
                        'relative p-4 rounded-lg border text-left transition-all',
                        'hover:bg-secondary/80',
                        difficultyPreset === option.value
                          ? 'bg-primary/10 border-primary'
                          : 'bg-secondary/50 border-border/50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-5 h-5', option.color)} />
                        <span className="font-medium text-sm">{t(option.labelKey)}</span>
                      </div>
                      {difficultyPreset === option.value && (
                        <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Penalty Preview */}
              {currentDifficultyParams.missPenaltyEnabled && (
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm font-medium mb-2">{t('penalty.title')}</p>
                  <div className="flex items-center gap-2 text-xs">
                    {penaltyPreview.map((percent, index) => (
                      <span key={index} className={cn(
                        'px-2 py-1 rounded',
                        index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                        index === 1 ? 'bg-orange-500/20 text-orange-600' :
                        index === 2 ? 'bg-red-500/20 text-red-600' :
                        'bg-red-600/20 text-red-700'
                      )}>
                        {t('penalty.time_nth', { n: index + 1, percent })}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </Card>
        </motion.div>

        {/* Practice Mode Setting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">{t('practice_mode.title')}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('practice_mode.description')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRACTICE_MODE_OPTIONS.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => onPracticeModeChange(option.value)}
                      className={cn(
                        'relative p-4 rounded-lg border text-left transition-all',
                        'hover:bg-secondary/80',
                        practiceMode === option.value
                          ? 'bg-primary/10 border-primary'
                          : 'bg-secondary/50 border-border/50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{t(option.labelKey)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t(option.descKey)}
                      </div>
                      {practiceMode === option.value && (
                        <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Time Limit Settings - Card Style UI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">{t('time_limit.title')}</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('time_limit.description')}
                </p>
              </div>

              {/* Current → Target KPS Card */}
              <div className="p-5 rounded-xl bg-linear-to-r from-secondary/80 to-primary/10 border border-border/50">
                <div className="flex items-center justify-between gap-4">
                  {/* Current KPS */}
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground mb-1">{t('time_limit.current')}</p>
                    <p className="text-3xl font-bold tabular-nums">{kpsStatus.averageKps}</p>
                    <p className="text-xs text-muted-foreground">{t('time_limit.keys_per_sec')}</p>
                  </div>
                  
                  {/* Arrow */}
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight className="w-6 h-6 text-primary" />
                    {targetKpsInfo.isFaster && targetKpsInfo.percentDiff > 0 && (
                      <div className="flex items-center gap-1 text-xs text-orange-500">
                        <TrendingUp className="w-3 h-3" />
                        <span>+{targetKpsInfo.percentDiff}%</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Target KPS */}
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground mb-1">{t('time_limit.target')}</p>
                    <p className="text-3xl font-bold tabular-nums text-primary">{targetKpsInfo.targetKps}</p>
                    <p className="text-xs text-muted-foreground">{t('time_limit.keys_per_sec')}</p>
                  </div>
                </div>
                
                {/* Confidence Bar */}
                {kpsStatus.confidence < 100 && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{kpsStatus.label}</span>
                      <span>{t('time_limit.games_played', { count: kpsStatus.gamesPlayed })}</span>
                    </div>
                    <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${kpsStatus.confidence}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Time Limit Example */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border/30">
                <p className="text-sm font-medium mb-2">{t('time_limit.example_title')}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {t('time_limit.example_word')} ({exampleKeystrokeCount}{t('time_limit.keystrokes')})
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold tabular-nums text-primary">{timeLimitExample}</span>
                    <span className="text-sm text-muted-foreground ml-1">{t('time_limit.seconds')}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('time_limit.example_note')}
                </p>
              </div>

            </div>
          </Card>
        </motion.div>

        {/* Advanced Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">{t('advanced.title')}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('advanced.description')}
                </p>
              </div>

              {/* SRS Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="srs-enabled" className="text-sm font-medium">
                    {t('advanced.srs')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('advanced.srs_desc')}
                  </p>
                </div>
                <Switch
                  id="srs-enabled"
                  checked={srsEnabled}
                  onCheckedChange={onSrsEnabledChange}
                />
              </div>

              {/* Warmup Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="warmup-enabled" className="text-sm font-medium">
                    {t('advanced.warmup')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('advanced.warmup_desc')}
                  </p>
                </div>
                <Switch
                  id="warmup-enabled"
                  checked={warmupEnabled}
                  onCheckedChange={onWarmupEnabledChange}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Theme Setting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">{t('theme.title')}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('theme.description')}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onThemeChange(option.value)}
                    className={cn(
                      'relative p-4 rounded-lg border text-left transition-all',
                      'hover:bg-secondary/80',
                      theme === option.value
                        ? 'bg-primary/10 border-primary'
                        : 'bg-secondary/50 border-border/50'
                    )}
                  >
                    <div className="font-medium">{t(option.labelKey)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t(option.descKey)}
                    </div>
                    {theme === option.value && (
                      <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {t('theme.note')}
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </Container>
  )
}
