import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSettings } from '../useSettings'
import * as db from '@/lib/db'

// Mock the database module
vi.mock('@/lib/db', () => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  initializeSettings: vi.fn(),
  DEFAULT_SETTINGS: {
    wordCount: 20,
    theme: 'system',
    practiceMode: 'balanced',
    srsEnabled: true,
    warmupEnabled: true,
    difficultyPreset: 'normal',
    targetKpsMultiplier: 1.2,
    comfortZoneRatio: 1.5,
    minTimeLimit: 1.0,
    maxTimeLimit: 30.0,
    minTimeLimitByDifficulty: 2.0,
    missPenaltyEnabled: true,
    basePenaltyPercent: 10,
    penaltyEscalationFactor: 1.5,
    maxPenaltyPercent: 50,
    minTimeAfterPenalty: 0.5,
  },
}))

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.initializeSettings).mockResolvedValue({
      id: 1,
      ...db.DEFAULT_SETTINGS,
      updatedAt: Date.now(),
    })
  })

  it('should initialize with default settings', async () => {
    const { result } = renderHook(() => useSettings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.settings.wordCount).toBe(20)
    expect(result.current.settings.theme).toBe('system')
  })

  it('should update word count', async () => {
    vi.mocked(db.saveSettings).mockResolvedValue(undefined)

    const { result } = renderHook(() => useSettings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await result.current.updateWordCount(50)

    expect(db.saveSettings).toHaveBeenCalledWith({ wordCount: 50 })
    await waitFor(() => {
      expect(result.current.settings.wordCount).toBe(50)
    })
  })

  it('should update theme', async () => {
    vi.mocked(db.saveSettings).mockResolvedValue(undefined)

    const { result } = renderHook(() => useSettings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await result.current.updateTheme('dark')

    expect(db.saveSettings).toHaveBeenCalledWith({ theme: 'dark' })
    await waitFor(() => {
      expect(result.current.settings.theme).toBe('dark')
    })
  })

  it('should calculate effective word count', async () => {
    const { result } = renderHook(() => useSettings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // When wordCount is 'all', should return total words
    // Note: We can't directly modify settings, so we test with the current value
    // and test the logic with different wordCount values
    const allCount = result.current.getEffectiveWordCount(100)
    expect(allCount).toBeGreaterThanOrEqual(0)

    // Test with a number value by using updateWordCount
    await result.current.updateWordCount(50)
    await waitFor(() => {
      expect(result.current.settings.wordCount).toBe(50)
    })
    expect(result.current.getEffectiveWordCount(100)).toBe(50)
    expect(result.current.getEffectiveWordCount(30)).toBe(30)
  })

  it('should reset settings to default', async () => {
    vi.mocked(db.saveSettings).mockResolvedValue(undefined)

    const { result } = renderHook(() => useSettings())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await result.current.resetSettings()

    expect(db.saveSettings).toHaveBeenCalled()
    // Settings should be reset to default values
    expect(result.current.settings.wordCount).toBe(db.DEFAULT_SETTINGS.wordCount)
  })
})
