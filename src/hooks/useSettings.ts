import { useState, useEffect, useCallback } from 'react'
import {
  AppSettings,
  WordCountPreset,
  ThemeType,
  PracticeMode,
  DifficultyPreset,
} from '@/lib/types'
import { saveSettings, initializeSettings, DEFAULT_SETTINGS } from '@/lib/db'
import { DIFFICULTY_PRESETS } from '@/lib/difficulty-presets'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await initializeSettings()
        setSettings({
          wordCount: savedSettings.wordCount,
          theme: savedSettings.theme,
          practiceMode: savedSettings.practiceMode ?? DEFAULT_SETTINGS.practiceMode,
          srsEnabled: savedSettings.srsEnabled ?? DEFAULT_SETTINGS.srsEnabled,
          warmupEnabled: savedSettings.warmupEnabled ?? DEFAULT_SETTINGS.warmupEnabled,
          // 難易度設定
          difficultyPreset: savedSettings.difficultyPreset ?? DEFAULT_SETTINGS.difficultyPreset,
          // 制限時間設定（難易度に応じて自動計算）
          targetKpsMultiplier:
            savedSettings.targetKpsMultiplier ?? DEFAULT_SETTINGS.targetKpsMultiplier,
          comfortZoneRatio: savedSettings.comfortZoneRatio ?? DEFAULT_SETTINGS.comfortZoneRatio,
          minTimeLimit: savedSettings.minTimeLimit ?? DEFAULT_SETTINGS.minTimeLimit,
          maxTimeLimit: savedSettings.maxTimeLimit ?? DEFAULT_SETTINGS.maxTimeLimit,
          minTimeLimitByDifficulty:
            savedSettings.minTimeLimitByDifficulty ?? DEFAULT_SETTINGS.minTimeLimitByDifficulty,
          // ミスペナルティ設定
          missPenaltyEnabled:
            savedSettings.missPenaltyEnabled ?? DEFAULT_SETTINGS.missPenaltyEnabled,
          basePenaltyPercent:
            savedSettings.basePenaltyPercent ?? DEFAULT_SETTINGS.basePenaltyPercent,
          penaltyEscalationFactor:
            savedSettings.penaltyEscalationFactor ?? DEFAULT_SETTINGS.penaltyEscalationFactor,
          maxPenaltyPercent: savedSettings.maxPenaltyPercent ?? DEFAULT_SETTINGS.maxPenaltyPercent,
          minTimeAfterPenalty:
            savedSettings.minTimeAfterPenalty ?? DEFAULT_SETTINGS.minTimeAfterPenalty,
        })
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Update word count setting
  const updateWordCount = useCallback(async (wordCount: WordCountPreset) => {
    try {
      await saveSettings({ wordCount })
      setSettings(prev => ({ ...prev, wordCount }))
    } catch (error) {
      console.error('Failed to save word count setting:', error)
    }
  }, [])

  // Update theme setting
  const updateTheme = useCallback(async (theme: ThemeType) => {
    try {
      await saveSettings({ theme })
      setSettings(prev => ({ ...prev, theme }))
    } catch (error) {
      console.error('Failed to save theme setting:', error)
    }
  }, [])

  // Update practice mode setting
  const updatePracticeMode = useCallback(async (practiceMode: PracticeMode) => {
    try {
      await saveSettings({ practiceMode })
      setSettings(prev => ({ ...prev, practiceMode }))
    } catch (error) {
      console.error('Failed to save practice mode setting:', error)
    }
  }, [])

  // Update SRS enabled setting
  const updateSrsEnabled = useCallback(async (srsEnabled: boolean) => {
    try {
      await saveSettings({ srsEnabled })
      setSettings(prev => ({ ...prev, srsEnabled }))
    } catch (error) {
      console.error('Failed to save SRS setting:', error)
    }
  }, [])

  // Update warmup enabled setting
  const updateWarmupEnabled = useCallback(async (warmupEnabled: boolean) => {
    try {
      await saveSettings({ warmupEnabled })
      setSettings(prev => ({ ...prev, warmupEnabled }))
    } catch (error) {
      console.error('Failed to save warmup setting:', error)
    }
  }, [])

  // Update difficulty preset (applies all related settings)
  const updateDifficultyPreset = useCallback(async (difficultyPreset: DifficultyPreset) => {
    try {
      const presetParams = DIFFICULTY_PRESETS[difficultyPreset]
      const updates = {
        difficultyPreset,
        targetKpsMultiplier: presetParams.targetKpsMultiplier,
        comfortZoneRatio: presetParams.comfortZoneRatio,
        minTimeLimitByDifficulty: presetParams.minTimeLimitByDifficulty,
        missPenaltyEnabled: presetParams.missPenaltyEnabled,
        basePenaltyPercent: presetParams.basePenaltyPercent,
        penaltyEscalationFactor: presetParams.penaltyEscalationFactor,
        maxPenaltyPercent: presetParams.maxPenaltyPercent,
        minTimeAfterPenalty: presetParams.minTimeAfterPenalty,
      }
      await saveSettings(updates)
      setSettings(prev => ({ ...prev, ...updates }))
    } catch (error) {
      console.error('Failed to save difficulty preset:', error)
    }
  }, [])

  // Update min time limit setting
  const updateMinTimeLimit = useCallback(async (minTimeLimit: number) => {
    try {
      await saveSettings({ minTimeLimit })
      setSettings(prev => ({ ...prev, minTimeLimit }))
    } catch (error) {
      console.error('Failed to save min time limit setting:', error)
    }
  }, [])

  // Update max time limit setting
  const updateMaxTimeLimit = useCallback(async (maxTimeLimit: number) => {
    try {
      await saveSettings({ maxTimeLimit })
      setSettings(prev => ({ ...prev, maxTimeLimit }))
    } catch (error) {
      console.error('Failed to save max time limit setting:', error)
    }
  }, [])

  // Get the actual word count to use (considering available words)
  const getEffectiveWordCount = useCallback(
    (totalWords: number): number => {
      if (settings.wordCount === 'all') {
        return totalWords
      }
      return Math.min(settings.wordCount, totalWords)
    },
    [settings.wordCount]
  )

  // Reset all settings to default
  const resetSettings = useCallback(async () => {
    try {
      await saveSettings(DEFAULT_SETTINGS)
      setSettings(DEFAULT_SETTINGS)
    } catch (error) {
      console.error('Failed to reset settings:', error)
      throw error
    }
  }, [])

  return {
    settings,
    isLoading,
    updateWordCount,
    updateTheme,
    updatePracticeMode,
    updateSrsEnabled,
    updateWarmupEnabled,
    getEffectiveWordCount,
    // 難易度プリセット
    updateDifficultyPreset,
    // 制限時間設定
    updateMinTimeLimit,
    updateMaxTimeLimit,
    // 設定リセット
    resetSettings,
  }
}
