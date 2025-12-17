import { useTranslation } from 'react-i18next'
import { Container } from '@/components/Container'
import { ScreenHeader } from '@/components/ScreenHeader'
import { getKpsStatus, getTargetKpsInfo, calculateTimeLimitExample } from '@/lib/adaptive-time-utils'
import { generatePenaltyPreview, DIFFICULTY_PRESETS } from '@/lib/difficulty-presets'
import {
  LanguageSetting,
  WordCountSetting,
  DifficultyPresetSetting,
  PracticeModeSetting,
  TimeLimitSetting,
  AdvancedSettings,
  ThemeSetting,
  ResetAllSetting,
  type SettingsScreenProps,
} from '@/components/settings'

const EXAMPLE_KEYSTROKE_COUNT = 9

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
  onResetAll,
}: SettingsScreenProps) {
  const { t, i18n } = useTranslation('settings')
  
  // KPS関連の計算
  const kpsStatus = getKpsStatus(gameScores)
  
  // 現在の難易度に応じたパラメータを取得
  const currentDifficultyParams = DIFFICULTY_PRESETS[difficultyPreset]
  
  // 目標KPS情報を取得
  const targetKpsInfo = getTargetKpsInfo(gameScores, currentDifficultyParams.targetKpsMultiplier)
  
  // 制限時間の例（9打鍵の単語「さくらんぼ」を想定）
  const timeLimitExample = calculateTimeLimitExample(
    EXAMPLE_KEYSTROKE_COUNT,
    kpsStatus.averageKps,
    currentDifficultyParams.targetKpsMultiplier,
    currentDifficultyParams.comfortZoneRatio,
    minTimeLimit,
    maxTimeLimit,
    currentDifficultyParams.minTimeLimitByDifficulty
  )
  
  // ペナルティプレビュー
  const penaltyPreview = generatePenaltyPreview(currentDifficultyParams, 4)

  // 言語設定
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
        <LanguageSetting
          currentLanguage={currentLanguage}
          onLanguageChange={changeLanguage}
        />

        <WordCountSetting
          wordCount={wordCount}
          onWordCountChange={onWordCountChange}
        />

        <DifficultyPresetSetting
          difficultyPreset={difficultyPreset}
          onDifficultyPresetChange={onDifficultyPresetChange}
          currentDifficultyParams={currentDifficultyParams}
          penaltyPreview={penaltyPreview}
        />

        <PracticeModeSetting
          practiceMode={practiceMode}
          onPracticeModeChange={onPracticeModeChange}
        />

        <TimeLimitSetting
          kpsStatus={kpsStatus}
          targetKpsInfo={targetKpsInfo}
          timeLimitExample={timeLimitExample}
          exampleKeystrokeCount={EXAMPLE_KEYSTROKE_COUNT}
        />

        <AdvancedSettings
          srsEnabled={srsEnabled}
          warmupEnabled={warmupEnabled}
          onSrsEnabledChange={onSrsEnabledChange}
          onWarmupEnabledChange={onWarmupEnabledChange}
        />

        <ThemeSetting
          theme={theme}
          onThemeChange={onThemeChange}
        />

        <ResetAllSetting
          onResetAll={onResetAll}
        />
      </div>
    </Container>
  )
}
