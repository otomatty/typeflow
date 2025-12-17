import { WordCountPreset, ThemeType, PracticeMode, DifficultyPreset } from '@/lib/types'
import { GameScoreRecord } from '@/lib/db'
import { DifficultyParams } from '@/lib/types'

export interface SettingsScreenProps {
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
  // 全データリセット
  onResetAll: () => Promise<void>
}

export interface LanguageSettingProps {
  currentLanguage: 'ja' | 'en'
  onLanguageChange: (lang: 'ja' | 'en') => void
}

export interface WordCountSettingProps {
  wordCount: WordCountPreset
  onWordCountChange: (value: WordCountPreset) => void
}

export interface DifficultyPresetSettingProps {
  difficultyPreset: DifficultyPreset
  onDifficultyPresetChange: (value: DifficultyPreset) => void
  currentDifficultyParams: DifficultyParams
  penaltyPreview: number[]
}

export interface PracticeModeSettingProps {
  practiceMode: PracticeMode
  onPracticeModeChange: (value: PracticeMode) => void
}

export interface TimeLimitSettingProps {
  kpsStatus: {
    averageKps: number
    confidence: number
    label: string
    gamesPlayed: number
  }
  targetKpsInfo: {
    targetKps: number
    isFaster: boolean
    percentDiff: number
  }
  timeLimitExample: number
  exampleKeystrokeCount: number
}

export interface AdvancedSettingsProps {
  srsEnabled: boolean
  warmupEnabled: boolean
  onSrsEnabledChange: (value: boolean) => void
  onWarmupEnabledChange: (value: boolean) => void
}

export interface ThemeSettingProps {
  theme: ThemeType
  onThemeChange: (value: ThemeType) => void
}

export interface ResetAllSettingProps {
  onResetAll: () => Promise<void>
}
