import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWords } from '../useWords'
import * as db from '@/lib/db'
import { toast } from 'sonner'

// Mock dependencies
vi.mock('@/lib/db')
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useWords', () => {
  const mockWords = [
    {
      id: 1,
      text: 'あいうえお',
      reading: 'あいうえお',
      romaji: 'aiueo',
      correct: 5,
      miss: 2,
      lastPlayed: Date.now(),
      accuracy: 71.4,
      createdAt: Date.now(),
      masteryLevel: 1,
      nextReviewAt: Date.now() + 1000,
      consecutiveCorrect: 2,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.getAllWords).mockResolvedValue(mockWords)
  })

  it('should load words on mount', async () => {
    const { result } = renderHook(() => useWords())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.words).toHaveLength(1)
    expect(result.current.words[0].text).toBe('あいうえお')
  })

  it('should add a word', async () => {
    vi.mocked(db.addWord).mockResolvedValue(2)
    vi.mocked(db.getAllWords)
      .mockResolvedValueOnce(mockWords)
      .mockResolvedValueOnce([
        ...mockWords,
        {
          id: 2,
          text: 'かきくけこ',
          reading: 'かきくけこ',
          romaji: 'kakikukeko',
          correct: 0,
          miss: 0,
          lastPlayed: 0,
          accuracy: 100,
          createdAt: Date.now(),
          masteryLevel: 0,
          nextReviewAt: 0,
          consecutiveCorrect: 0,
        },
      ])

    const { result } = renderHook(() => useWords())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await result.current.addWord({
      text: 'かきくけこ',
      reading: 'かきくけこ',
      romaji: 'kakikukeko',
    })

    expect(db.addWord).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('Word added successfully!')
  })

  it('should delete a word', async () => {
    vi.mocked(db.deleteWord).mockResolvedValue(undefined)
    vi.mocked(db.getAllWords).mockResolvedValueOnce(mockWords).mockResolvedValueOnce([])

    const { result } = renderHook(() => useWords())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await result.current.deleteWord('1')

    expect(db.deleteWord).toHaveBeenCalledWith(1)
    expect(toast.success).toHaveBeenCalledWith('Word deleted')
  })

  it('should edit a word', async () => {
    vi.mocked(db.updateWord).mockResolvedValue(undefined)
    const updatedWords = [
      {
        ...mockWords[0],
        text: '更新された',
        reading: 'こうしんされた',
        romaji: 'koushinsareta',
      },
    ]
    vi.mocked(db.getAllWords).mockResolvedValueOnce(mockWords).mockResolvedValueOnce(updatedWords)

    const { result } = renderHook(() => useWords())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await result.current.editWord('1', {
      text: '更新された',
      reading: 'こうしんされた',
      romaji: 'koushinsareta',
    })

    expect(db.updateWord).toHaveBeenCalledWith(1, {
      text: '更新された',
      reading: 'こうしんされた',
      romaji: 'koushinsareta',
    })
    expect(toast.success).toHaveBeenCalledWith('Word updated successfully!')
  })

  it('should handle errors gracefully', async () => {
    vi.mocked(db.getAllWords).mockRejectedValue(new Error('Database error'))

    const { result } = renderHook(() => useWords())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(toast.error).toHaveBeenCalledWith('Failed to load words. Is the server running?')
  })
})
