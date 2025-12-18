import { describe, it, expect } from 'vitest'
import {
  calculateAverageKps,
  calculateKpsConfidence,
  getWordKeystrokeCount,
  calculateTargetKps,
  calculateTargetKpsTimeLimit,
  calculateWordTimeLimit,
  getKpsStatus,
  getTargetKpsInfo,
  calculateTimeLimitExample,
} from '../adaptive-time-utils'
import type { Word, AppSettings } from '../types'
import type { GameScoreRecord } from '../db'

describe('adaptive-time-utils', () => {
  const mockWord: Word = {
    id: '1',
    text: 'あいうえお',
    reading: 'あいうえお',
    romaji: 'aiueo',
    stats: {
      correct: 0,
      miss: 0,
      lastPlayed: 0,
      accuracy: 100,
      createdAt: Date.now(),
      masteryLevel: 0,
      nextReviewAt: 0,
      consecutiveCorrect: 0,
    },
  }

  const mockSettings: Pick<
    AppSettings,
    | 'targetKpsMultiplier'
    | 'comfortZoneRatio'
    | 'minTimeLimit'
    | 'maxTimeLimit'
    | 'minTimeLimitByDifficulty'
  > = {
    targetKpsMultiplier: 1.2,
    comfortZoneRatio: 1.5,
    minTimeLimit: 1.0,
    maxTimeLimit: 30.0,
    minTimeLimitByDifficulty: 2.0,
  }

  describe('calculateAverageKps', () => {
    it('should return default KPS for empty scores', () => {
      expect(calculateAverageKps([])).toBe(3.0)
    })

    it('should calculate average from recent scores', () => {
      const scores: GameScoreRecord[] = [
        {
          id: 1,
          kps: 4.0,
          totalKeystrokes: 40,
          accuracy: 90,
          correctWords: 8,
          perfectWords: 6,
          totalWords: 10,
          totalTime: 10,
          playedAt: Date.now() - 1000,
        },
        {
          id: 2,
          kps: 5.0,
          totalKeystrokes: 50,
          accuracy: 95,
          correctWords: 9,
          perfectWords: 7,
          totalWords: 10,
          totalTime: 10,
          playedAt: Date.now() - 2000,
        },
        {
          id: 3,
          kps: 6.0,
          totalKeystrokes: 60,
          accuracy: 98,
          correctWords: 10,
          perfectWords: 9,
          totalWords: 10,
          totalTime: 10,
          playedAt: Date.now() - 3000,
        },
      ]
      const result = calculateAverageKps(scores)
      expect(result).toBe(5.0)
    })

    it('should use only recent 10 scores', () => {
      const scores: GameScoreRecord[] = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        kps: 4.0 + i * 0.1,
        totalKeystrokes: 40 + i * 10,
        accuracy: 90,
        correctWords: 8,
        perfectWords: 6,
        totalWords: 10,
        totalTime: 10,
        playedAt: Date.now() - i * 1000,
      }))
      const result = calculateAverageKps(scores)
      // Should use only the most recent 10 scores
      expect(result).toBeGreaterThan(0)
    })

    it('should filter out invalid scores', () => {
      const scores: GameScoreRecord[] = [
        {
          id: 1,
          kps: 0,
          totalKeystrokes: 0,
          accuracy: 0,
          correctWords: 0,
          perfectWords: 0,
          totalWords: 10,
          totalTime: 10,
          playedAt: Date.now(),
        },
        {
          id: 2,
          kps: 4.0,
          totalKeystrokes: 40,
          accuracy: 90,
          correctWords: 8,
          perfectWords: 6,
          totalWords: 10,
          totalTime: 0,
          playedAt: Date.now(),
        },
        {
          id: 3,
          kps: 5.0,
          totalKeystrokes: 50,
          accuracy: 95,
          correctWords: 9,
          perfectWords: 7,
          totalWords: 10,
          totalTime: 10,
          playedAt: Date.now(),
        },
      ]
      const result = calculateAverageKps(scores)
      expect(result).toBe(5.0)
    })
  })

  describe('calculateKpsConfidence', () => {
    it('should return 0 for empty scores', () => {
      expect(calculateKpsConfidence([])).toBe(0)
    })

    it('should calculate confidence based on score count', () => {
      const scores: GameScoreRecord[] = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        kps: 4.0,
        totalKeystrokes: 40,
        accuracy: 90,
        correctWords: 8,
        perfectWords: 6,
        totalWords: 10,
        totalTime: 10,
        playedAt: Date.now() - i * 1000,
      }))
      const result = calculateKpsConfidence(scores)
      expect(result).toBe(0.5) // 5 / 10
    })

    it('should cap confidence at 1.0', () => {
      const scores: GameScoreRecord[] = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        kps: 4.0,
        totalKeystrokes: 40,
        accuracy: 90,
        correctWords: 8,
        perfectWords: 6,
        totalWords: 10,
        totalTime: 10,
        playedAt: Date.now() - i * 1000,
      }))
      const result = calculateKpsConfidence(scores)
      expect(result).toBe(1.0)
    })
  })

  describe('getWordKeystrokeCount', () => {
    it('should count keystrokes from romaji', () => {
      expect(getWordKeystrokeCount(mockWord)).toBe(5) // 'aiueo'
    })

    it('should normalize romaji before counting', () => {
      const wordWithSpaces: Word = {
        ...mockWord,
        romaji: '  AIUEO  ',
      }
      expect(getWordKeystrokeCount(wordWithSpaces)).toBe(5)
    })
  })

  describe('calculateTargetKps', () => {
    it('should multiply average KPS by multiplier', () => {
      const result = calculateTargetKps(5.0, 1.2)
      expect(result).toBe(6.0)
    })

    it('should round to 1 decimal place', () => {
      const result = calculateTargetKps(3.33, 1.5)
      expect(result).toBe(5.0) // 3.33 * 1.5 = 4.995 -> 5.0
    })
  })

  describe('calculateTargetKpsTimeLimit', () => {
    it('should calculate time limit based on keystrokes and target KPS', () => {
      const result = calculateTargetKpsTimeLimit(
        mockWord,
        5.0, // targetKps
        1.5, // comfortZoneRatio
        1.0, // minTimeLimit
        30.0 // maxTimeLimit
      )
      // keystrokes = 5, theoretical = 5/5 = 1.0, adjusted = 1.0 * 1.5 = 1.5
      expect(result).toBe(1.5)
    })

    it('should respect min time limit', () => {
      const result = calculateTargetKpsTimeLimit(
        mockWord,
        10.0, // very high KPS
        1.0,
        2.0, // minTimeLimit
        30.0
      )
      expect(result).toBeGreaterThanOrEqual(2.0)
    })

    it('should respect max time limit', () => {
      const longWord: Word = {
        ...mockWord,
        romaji: 'a'.repeat(100),
      }
      const result = calculateTargetKpsTimeLimit(
        longWord,
        1.0, // very low KPS
        1.0,
        1.0,
        30.0 // maxTimeLimit
      )
      expect(result).toBeLessThanOrEqual(30.0)
    })
  })

  describe('calculateWordTimeLimit', () => {
    it('should calculate time limit with all settings', () => {
      const scores: GameScoreRecord[] = [
        {
          id: 1,
          kps: 5.0,
          totalKeystrokes: 50,
          accuracy: 90,
          correctWords: 8,
          perfectWords: 6,
          totalWords: 10,
          totalTime: 10,
          playedAt: Date.now(),
        },
      ]
      const result = calculateWordTimeLimit(mockWord, scores, mockSettings)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThanOrEqual(mockSettings.maxTimeLimit)
    })

    it('should respect minTimeLimitByDifficulty', () => {
      const scores: GameScoreRecord[] = []
      const result = calculateWordTimeLimit(mockWord, scores, mockSettings)
      expect(result).toBeGreaterThanOrEqual(mockSettings.minTimeLimitByDifficulty)
    })
  })

  describe('getKpsStatus', () => {
    it('should return status for empty scores', () => {
      const result = getKpsStatus([])
      expect(result.averageKps).toBe(3.0)
      expect(result.confidence).toBe(0)
      expect(result.gamesPlayed).toBe(0)
      expect(result.label).toBe('データ収集中...')
    })

    it('should return appropriate label based on confidence', () => {
      const lowConfidenceScores: GameScoreRecord[] = Array.from({ length: 2 }, (_, i) => ({
        id: i + 1,
        kps: 4.0,
        totalKeystrokes: 40,
        accuracy: 90,
        correctWords: 8,
        perfectWords: 6,
        totalWords: 10,
        totalTime: 10,
        playedAt: Date.now() - i * 1000,
      }))
      const result = getKpsStatus(lowConfidenceScores)
      expect(result.label).toBe('データ収集中...')
    })
  })

  describe('getTargetKpsInfo', () => {
    it('should calculate target KPS info', () => {
      const scores: GameScoreRecord[] = [
        {
          id: 1,
          kps: 5.0,
          totalKeystrokes: 50,
          accuracy: 90,
          correctWords: 8,
          perfectWords: 6,
          totalWords: 10,
          totalTime: 10,
          playedAt: Date.now(),
        },
      ]
      const result = getTargetKpsInfo(scores, 1.2)
      expect(result.averageKps).toBe(5.0)
      expect(result.targetKps).toBe(6.0)
      expect(result.percentDiff).toBe(20)
      expect(result.isFaster).toBe(true)
    })
  })

  describe('calculateTimeLimitExample', () => {
    it('should calculate example time limit', () => {
      const result = calculateTimeLimitExample(
        10, // keystrokeCount
        5.0, // averageKps
        1.2, // targetKpsMultiplier
        1.5, // comfortZoneRatio
        1.0, // minTimeLimit
        30.0, // maxTimeLimit
        2.0 // minTimeLimitByDifficulty
      )
      expect(result).toBeGreaterThanOrEqual(2.0)
      expect(result).toBeLessThanOrEqual(30.0)
    })
  })
})
