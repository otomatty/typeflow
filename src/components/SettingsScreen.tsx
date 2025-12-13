import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Container } from '@/components/Container'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Check, Target, Shuffle, ClockCounterClockwise, Scales, Timer, Lightning, Gauge, Flame, Trophy, Skull, Wrench, Globe } from '@phosphor-icons/react'
import { WordCountPreset, ThemeType, PracticeMode, TimeLimitMode, DifficultyPreset } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getKpsStatus } from '@/lib/adaptive-time-utils'
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
  // 動的制限時間設定
  timeLimitMode: TimeLimitMode
  fixedTimeLimit: number
  comfortZoneRatio: number
  // ミスペナルティ設定
  missPenaltyEnabled: boolean
  basePenaltyPercent: number
  penaltyEscalationFactor: number
  maxPenaltyPercent: number
  minTimeAfterPenalty: number
  gameScores: GameScoreRecord[]
  onWordCountChange: (value: WordCountPreset) => void
  onThemeChange: (value: ThemeType) => void
  onPracticeModeChange: (value: PracticeMode) => void
  onSrsEnabledChange: (value: boolean) => void
  onWarmupEnabledChange: (value: boolean) => void
  // 難易度設定のコールバック
  onDifficultyPresetChange: (value: DifficultyPreset) => void
  // 動的制限時間設定のコールバック
  onTimeLimitModeChange: (value: TimeLimitMode) => void
  onFixedTimeLimitChange: (value: number) => void
  onComfortZoneRatioChange: (value: number) => void
  // ミスペナルティ設定のコールバック
  onMissPenaltyEnabledChange: (value: boolean) => void
  onBasePenaltyPercentChange: (value: number) => void
  onPenaltyEscalationFactorChange: (value: number) => void
  onMaxPenaltyPercentChange: (value: number) => void
  onMinTimeAfterPenaltyChange: (value: number) => void
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
  timeLimitMode,
  fixedTimeLimit,
  comfortZoneRatio,
  missPenaltyEnabled,
  basePenaltyPercent,
  penaltyEscalationFactor,
  maxPenaltyPercent,
  minTimeAfterPenalty,
  gameScores,
  onWordCountChange,
  onThemeChange,
  onPracticeModeChange,
  onSrsEnabledChange,
  onWarmupEnabledChange,
  onDifficultyPresetChange,
  onTimeLimitModeChange,
  onFixedTimeLimitChange,
  onComfortZoneRatioChange,
  onMissPenaltyEnabledChange,
  onBasePenaltyPercentChange,
  onPenaltyEscalationFactorChange,
  onMaxPenaltyPercentChange,
  onMinTimeAfterPenaltyChange,
}: SettingsScreenProps) {
  const { t, i18n } = useTranslation('settings')
  
  const isAllWords = wordCount === 'all'
  const sliderValue = typeof wordCount === 'number' ? wordCount : 20
  const kpsStatus = getKpsStatus(gameScores)
  
  // ペナルティプレビュー用のパラメータ
  const currentDifficultyParams = difficultyPreset === 'custom' 
    ? { 
        comfortZoneRatio,
        missPenaltyEnabled, 
        basePenaltyPercent, 
        penaltyEscalationFactor, 
        maxPenaltyPercent,
        minTimeAfterPenalty,
      }
    : DIFFICULTY_PRESETS[difficultyPreset]
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
    { value: 'balanced', labelKey: 'practice_mode.balanced', descKey: 'practice_mode.balanced_desc', icon: Scales },
    { value: 'weakness-focus', labelKey: 'practice_mode.weakness', descKey: 'practice_mode.weakness_desc', icon: Target },
    { value: 'review', labelKey: 'practice_mode.review', descKey: 'practice_mode.review_desc', icon: ClockCounterClockwise },
    { value: 'random', labelKey: 'practice_mode.random', descKey: 'practice_mode.random_desc', icon: Shuffle },
  ]

  const TIME_LIMIT_MODE_OPTIONS: { 
    value: TimeLimitMode
    labelKey: string
    descKey: string
    icon: typeof Timer
  }[] = [
    { value: 'adaptive', labelKey: 'time_limit.adaptive', descKey: 'time_limit.adaptive_desc', icon: Lightning },
    { value: 'fixed', labelKey: 'time_limit.fixed', descKey: 'time_limit.fixed_desc', icon: Timer },
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
    { value: 'custom', labelKey: 'difficulty.custom', descKey: 'difficulty.custom_desc', icon: Wrench, color: 'text-purple-500' },
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

  const handleFixedTimeLimitChange = (values: number[]) => {
    if (values[0] !== undefined) {
      onFixedTimeLimitChange(values[0])
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
                  <Globe className="w-5 h-5 text-primary" weight="bold" />
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
                    <Check className="absolute top-2 right-2 w-5 h-5 text-primary" weight="bold" />
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
                    <Check className="absolute top-2 right-2 w-5 h-5 text-primary" weight="bold" />
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
                  <Flame className="w-5 h-5 text-primary" weight="bold" />
                  <Label className="text-base font-semibold">{t('difficulty.title')}</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('difficulty.description')}
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                        <Icon className={cn('w-5 h-5', option.color)} weight="bold" />
                        <span className="font-medium text-sm">{t(option.labelKey)}</span>
                      </div>
                      {difficultyPreset === option.value && (
                        <Check className="absolute top-2 right-2 w-4 h-4 text-primary" weight="bold" />
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

              {/* Custom settings (only shown when custom is selected) */}
              {difficultyPreset === 'custom' && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">{t('custom.title')}</p>
                  
                  {/* Comfort Zone Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{t('custom.time_comfort')}</Label>
                      <span className="text-sm font-medium">{Math.round(comfortZoneRatio * 100)}%</span>
                    </div>
                    <Slider
                      value={[comfortZoneRatio]}
                      onValueChange={(v) => onComfortZoneRatioChange(v[0])}
                      min={0.60}
                      max={1.00}
                      step={0.05}
                      className="w-full"
                    />
                  </div>

                  {/* Miss Penalty Toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{t('custom.miss_penalty')}</Label>
                    <Switch
                      checked={missPenaltyEnabled}
                      onCheckedChange={onMissPenaltyEnabledChange}
                    />
                  </div>

                  {missPenaltyEnabled && (
                    <>
                      {/* Base Penalty Percent */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">{t('custom.base_penalty')}</Label>
                          <span className="text-sm font-medium">{basePenaltyPercent}%</span>
                        </div>
                        <Slider
                          value={[basePenaltyPercent]}
                          onValueChange={(v) => onBasePenaltyPercentChange(v[0])}
                          min={1}
                          max={20}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Escalation Factor */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">{t('custom.escalation_factor')}</Label>
                          <span className="text-sm font-medium">{penaltyEscalationFactor}x</span>
                        </div>
                        <Slider
                          value={[penaltyEscalationFactor]}
                          onValueChange={(v) => onPenaltyEscalationFactorChange(v[0])}
                          min={1.0}
                          max={3.0}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      {/* Max Penalty */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">{t('custom.max_penalty')}</Label>
                          <span className="text-sm font-medium">{maxPenaltyPercent}%</span>
                        </div>
                        <Slider
                          value={[maxPenaltyPercent]}
                          onValueChange={(v) => onMaxPenaltyPercentChange(v[0])}
                          min={10}
                          max={80}
                          step={5}
                          className="w-full"
                        />
                      </div>

                      {/* Min Time After Penalty */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">{t('custom.min_time')}</Label>
                          <span className="text-sm font-medium">{minTimeAfterPenalty}{t('time_limit.seconds')}</span>
                        </div>
                        <Slider
                          value={[minTimeAfterPenalty]}
                          onValueChange={(v) => onMinTimeAfterPenaltyChange(v[0])}
                          min={0.1}
                          max={2.0}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <Check className="absolute top-2 right-2 w-5 h-5 text-primary" weight="bold" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Time Limit Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary" weight="bold" />
                  <Label className="text-base font-semibold">{t('time_limit.title')}</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('time_limit.description')}
                </p>
              </div>

              {/* Time Limit Mode Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIME_LIMIT_MODE_OPTIONS.map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => onTimeLimitModeChange(option.value)}
                      className={cn(
                        'relative p-4 rounded-lg border text-left transition-all',
                        'hover:bg-secondary/80',
                        timeLimitMode === option.value
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
                      {timeLimitMode === option.value && (
                        <Check className="absolute top-2 right-2 w-5 h-5 text-primary" weight="bold" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Adaptive Mode Settings */}
              {timeLimitMode === 'adaptive' && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  {/* KPS Status */}
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{t('time_limit.your_avg_kps')}</p>
                        <p className="text-xs text-muted-foreground">{kpsStatus.label} ({t('time_limit.games_played', { count: kpsStatus.gamesPlayed })})</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold tabular-nums">{kpsStatus.averageKps}</span>
                        <span className="text-sm text-muted-foreground ml-1">{t('time_limit.keys_per_sec')}</span>
                      </div>
                    </div>
                    {kpsStatus.confidence < 100 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{t('time_limit.confidence')}</span>
                          <span>{kpsStatus.confidence}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${kpsStatus.confidence}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('time_limit.comfort_note')}
                  </p>
                </div>
              )}

              {/* Fixed Mode Settings */}
              {timeLimitMode === 'fixed' && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('time_limit.title')}</span>
                    <span className="text-2xl font-bold tabular-nums">
                      {fixedTimeLimit}
                      <span className="text-sm font-normal text-muted-foreground ml-1">{t('time_limit.seconds')}</span>
                    </span>
                  </div>
                  
                  <Slider
                    value={[fixedTimeLimit]}
                    onValueChange={handleFixedTimeLimitChange}
                    min={3}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3{t('time_limit.seconds')}</span>
                    <span>30{t('time_limit.seconds')}</span>
                  </div>
                </div>
              )}

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
                      <Check className="absolute top-2 right-2 w-5 h-5 text-primary" weight="bold" />
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
