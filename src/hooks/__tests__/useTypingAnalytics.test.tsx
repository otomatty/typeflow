import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTypingAnalytics } from '../useTypingAnalytics'
import * as db from '@/lib/db'

// Mock the database module
vi.mock('@/lib/db', () => ({
  getAggregatedStats: vi.fn(),
  saveAggregatedStats: vi.fn(),
  resetAggregatedStats: vi.fn(),
  getAllGameScores: vi.fn(),
  saveGameScore: vi.fn(),
  resetGameScores: vi.fn(),
}))

describe('useTypingAnalytics', () => {
  const mockStats = {
    id: 1,
    keyStats: {
      a: {
        key: 'a',
        totalCount: 10,
        errorCount: 2,
        totalLatency: 1000,
        confusedWith: {},
      },
    },
    transitionStats: {
      'a->b': {
        fromKey: 'a',
        toKey: 'b',
        totalCount: 5,
        errorCount: 1,
        totalLatency: 500,
      },
    },
    lastUpdated: Date.now(),
  }

  const mockGameScores = [
    {
      id: 1,
      kps: 4.5,
      totalKeystrokes: 100,
      accuracy: 90,
      completedWords: 8,
      successfulWords: 6,
      totalWords: 10,
      totalTime: 20,
      playedAt: Date.now(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.getAggregatedStats).mockResolvedValue(mockStats)
    vi.mocked(db.getAllGameScores).mockResolvedValue(mockGameScores)
  })

  it('should initialize with stats and scores', async () => {
    const { result } = renderHook(() => useTypingAnalytics())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(result.current.aggregatedStats).toEqual(mockStats)
    expect(result.current.gameScores).toEqual(mockGameScores)
  })

  it('should calculate weaknesses', async () => {
    const { result } = renderHook(() => useTypingAnalytics())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    const weaknesses = result.current.calculateWeaknesses()
    expect(weaknesses).toHaveProperty('weakKeys')
    expect(weaknesses).toHaveProperty('weakTransitions')
  })

  it('should reset session state', async () => {
    const { result } = renderHook(() => useTypingAnalytics())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    result.current.resetSessionState()
    const correctRate = result.current.getRecentCorrectRate()
    expect(correctRate).toBe(0.75) // Default value
  })

  it('should update session state', async () => {
    const { result } = renderHook(() => useTypingAnalytics())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    result.current.updateSessionState('word1', true)
    result.current.updateSessionState('word2', false)
    result.current.updateSessionState('word3', true)

    const correctRate = result.current.getRecentCorrectRate()
    expect(correctRate).toBeGreaterThan(0)
  })

  it('should build scoring context', async () => {
    const { result } = renderHook(() => useTypingAnalytics())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    const context = result.current.buildScoringContext('balanced', true, true)
    expect(context).toHaveProperty('weakKeys')
    expect(context).toHaveProperty('weakTransitions')
    expect(context.practiceMode).toBe('balanced')
    expect(context.srsEnabled).toBe(true)
    expect(context.warmupEnabled).toBe(true)
  })

  it('should save game score', async () => {
    vi.mocked(db.saveGameScore).mockResolvedValue(2)
    vi.mocked(db.getAllGameScores)
      .mockResolvedValueOnce(mockGameScores)
      .mockResolvedValueOnce([
        ...mockGameScores,
        {
          id: 2,
          kps: 5.0,
          totalKeystrokes: 120,
          accuracy: 95,
          completedWords: 10,
          successfulWords: 9,
          totalWords: 10,
          totalTime: 24,
          playedAt: Date.now(),
        },
      ])

    const { result } = renderHook(() => useTypingAnalytics())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await result.current.saveScore({
      kps: 5.0,
      totalKeystrokes: 120,
      accuracy: 95,
      completedWords: 10,
      successfulWords: 9,
      failedWords: 1,
      totalWords: 10,
      totalTime: 24,
      avgReactionTime: 200,
      firstKeyAccuracy: 100,
      wordPerformances: [],
    })

    expect(db.saveGameScore).toHaveBeenCalled()
  })

  it('should reset stats', async () => {
    vi.mocked(db.resetAggregatedStats).mockResolvedValue(undefined)
    vi.mocked(db.resetGameScores).mockResolvedValue(undefined)

    const { result } = renderHook(() => useTypingAnalytics())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    await result.current.resetStats()

    expect(db.resetAggregatedStats).toHaveBeenCalled()
    expect(db.resetGameScores).toHaveBeenCalled()
  })
})
