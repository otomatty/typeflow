import { motion } from 'framer-motion'
import { Container } from '@/components/Container'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Check, Target, Shuffle, ClockCounterClockwise, Scales, Timer, Lightning, Gauge, Flame, Trophy, Skull, Wrench } from '@phosphor-icons/react'
import { WordCountPreset, ThemeType, PracticeMode, TimeLimitMode, DifficultyPreset } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getKpsStatus } from '@/lib/adaptive-time-utils'
import { DIFFICULTY_LABELS, generatePenaltyPreview, DIFFICULTY_PRESETS } from '@/lib/difficulty-presets'
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

const THEME_OPTIONS: { value: ThemeType; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: '明るいテーマ' },
  { value: 'dark', label: 'Dark', description: '暗いテーマ' },
  { value: 'system', label: 'System', description: 'システム設定に従う' },
]

const PRACTICE_MODE_OPTIONS: { 
  value: PracticeMode
  label: string
  description: string
  icon: typeof Target
}[] = [
  { 
    value: 'balanced', 
    label: 'バランス', 
    description: '弱点・復習・新規をバランスよく出題',
    icon: Scales,
  },
  { 
    value: 'weakness-focus', 
    label: '弱点強化', 
    description: '苦手な単語を重点的に練習',
    icon: Target,
  },
  { 
    value: 'review', 
    label: '復習優先', 
    description: '忘れかけの単語を優先して復習',
    icon: ClockCounterClockwise,
  },
  { 
    value: 'random', 
    label: 'ランダム', 
    description: '完全にランダムに出題',
    icon: Shuffle,
  },
]

const MIN_WORD_COUNT = 5
const MAX_WORD_COUNT = 100
const STEP = 5

const TIME_LIMIT_MODE_OPTIONS: { 
  value: TimeLimitMode
  label: string
  description: string
  icon: typeof Timer
}[] = [
  { 
    value: 'adaptive', 
    label: '適応型', 
    description: 'あなたの実力に合わせて自動調整',
    icon: Lightning,
  },
  { 
    value: 'fixed', 
    label: '固定', 
    description: '一定の制限時間で練習',
    icon: Timer,
  },
]

const DIFFICULTY_OPTIONS: {
  value: DifficultyPreset
  label: string
  description: string
  icon: typeof Flame
  color: string
}[] = [
  {
    value: 'easy',
    label: DIFFICULTY_LABELS.easy.name,
    description: DIFFICULTY_LABELS.easy.description,
    icon: Target,
    color: 'text-green-500',
  },
  {
    value: 'normal',
    label: DIFFICULTY_LABELS.normal.name,
    description: DIFFICULTY_LABELS.normal.description,
    icon: Flame,
    color: 'text-yellow-500',
  },
  {
    value: 'hard',
    label: DIFFICULTY_LABELS.hard.name,
    description: DIFFICULTY_LABELS.hard.description,
    icon: Trophy,
    color: 'text-orange-500',
  },
  {
    value: 'expert',
    label: DIFFICULTY_LABELS.expert.name,
    description: DIFFICULTY_LABELS.expert.description,
    icon: Skull,
    color: 'text-red-500',
  },
  {
    value: 'custom',
    label: DIFFICULTY_LABELS.custom.name,
    description: DIFFICULTY_LABELS.custom.description,
    icon: Wrench,
    color: 'text-purple-500',
  },
]

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

  return (
    <Container>
      <ScreenHeader
        title="Settings"
        description="ゲームの設定を変更できます"
      />

      <div className="mt-8 space-y-6">
        {/* Word Count Setting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">出題数</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  1ゲームで出題する単語の数を選択します
                </p>
              </div>

              {/* All Words Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="all-words" className="text-sm font-medium">
                    全ての単語を使用
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    登録されている全ての単語を出題します
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
                  <span className="text-sm text-muted-foreground">出題数を選択</span>
                  <span className="text-2xl font-bold tabular-nums">
                    {sliderValue}
                    <span className="text-sm font-normal text-muted-foreground ml-1">問</span>
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
                  <span>{MIN_WORD_COUNT}問</span>
                  <span>{MAX_WORD_COUNT}問</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                ※ 登録単語数が選択した数より少ない場合は、登録されている全ての単語が出題されます
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
                  <Label className="text-base font-semibold">難易度</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ゲームの難易度を選択します。制限時間とミスペナルティが調整されます
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
                        <span className="font-medium text-sm">{option.label}</span>
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
                  <p className="text-sm font-medium mb-2">ミスペナルティ（段階的割合減少）</p>
                  <div className="flex items-center gap-2 text-xs">
                    {penaltyPreview.map((percent, index) => (
                      <span key={index} className={cn(
                        'px-2 py-1 rounded',
                        index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                        index === 1 ? 'bg-orange-500/20 text-orange-600' :
                        index === 2 ? 'bg-red-500/20 text-red-600' :
                        'bg-red-600/20 text-red-700'
                      )}>
                        {index + 1}回目: {percent}%
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom settings (only shown when custom is selected) */}
              {difficultyPreset === 'custom' && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">詳細設定</p>
                  
                  {/* Comfort Zone Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">制限時間の余裕</Label>
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
                    <Label className="text-sm">ミスペナルティ</Label>
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
                          <Label className="text-sm">基本ペナルティ</Label>
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
                          <Label className="text-sm">増加倍率</Label>
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
                          <Label className="text-sm">最大ペナルティ</Label>
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
                          <Label className="text-sm">最低残り時間</Label>
                          <span className="text-sm font-medium">{minTimeAfterPenalty}秒</span>
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
                <Label className="text-base font-semibold">練習モード</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  出題アルゴリズムを選択します
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
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {option.description}
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
                  <Label className="text-base font-semibold">制限時間</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ゲームの制限時間を設定します
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
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {option.description}
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
                        <p className="text-sm font-medium">あなたの平均打鍵速度</p>
                        <p className="text-xs text-muted-foreground">{kpsStatus.label} ({kpsStatus.gamesPlayed}ゲーム)</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold tabular-nums">{kpsStatus.averageKps}</span>
                        <span className="text-sm text-muted-foreground ml-1">打/秒</span>
                      </div>
                    </div>
                    {kpsStatus.confidence < 100 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>信頼度</span>
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
                    ※ 制限時間の余裕は難易度設定で調整できます
                  </p>
                </div>
              )}

              {/* Fixed Mode Settings */}
              {timeLimitMode === 'fixed' && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">制限時間</span>
                    <span className="text-2xl font-bold tabular-nums">
                      {fixedTimeLimit}
                      <span className="text-sm font-normal text-muted-foreground ml-1">秒</span>
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
                    <span>3秒</span>
                    <span>30秒</span>
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
                <Label className="text-base font-semibold">高度な設定</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  出題アルゴリズムの詳細設定
                </p>
              </div>

              {/* SRS Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="srs-enabled" className="text-sm font-medium">
                    間隔反復システム（SRS）
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    忘却曲線に基づいて最適なタイミングで復習単語を出題
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
                    ウォームアップフェーズ
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    セッション開始時は易しい単語から徐々に難易度を上げる
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
                <Label className="text-base font-semibold">テーマ</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  アプリの外観を選択します
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
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </div>
                    {theme === option.value && (
                      <Check className="absolute top-2 right-2 w-5 h-5 text-primary" weight="bold" />
                    )}
                  </button>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">
                ※ テーマの変更は今後のアップデートで反映されます
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </Container>
  )
}
