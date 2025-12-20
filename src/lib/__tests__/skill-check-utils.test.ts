import { describe, it, expect } from 'vitest'
import { recommendDifficulty, getSkillCheckDescription } from '../skill-check-utils'
import type { GameStats } from '../types'

describe('skill-check-utils', () => {
  describe('recommendDifficulty', () => {
    it('should recommend easy for low accuracy', () => {
      const stats: GameStats = {
        kps: 5.0,
        totalKeystrokes: 50,
        accuracy: 50,
        completedWords: 5,
        successfulWords: 3,
        failedWords: 2,
        totalWords: 10,
        totalTime: 10,
        avgReactionTime: 200,
        firstKeyAccuracy: 80,
        wordPerformances: [],
      }
      expect(recommendDifficulty(stats)).toBe('easy')
    })

    it('should recommend easy for low KPS', () => {
      const stats: GameStats = {
        kps: 1.5,
        totalKeystrokes: 15,
        accuracy: 90,
        completedWords: 9,
        successfulWords: 8,
        failedWords: 1,
        totalWords: 10,
        totalTime: 10,
        avgReactionTime: 200,
        firstKeyAccuracy: 100,
        wordPerformances: [],
      }
      expect(recommendDifficulty(stats)).toBe('easy')
    })

    it('should recommend normal for medium KPS with high accuracy', () => {
      const stats: GameStats = {
        kps: 3.0,
        totalKeystrokes: 30,
        accuracy: 85,
        completedWords: 8,
        successfulWords: 7,
        failedWords: 1,
        totalWords: 10,
        totalTime: 10,
        avgReactionTime: 200,
        firstKeyAccuracy: 90,
        wordPerformances: [],
      }
      expect(recommendDifficulty(stats)).toBe('normal')
    })

    it('should recommend normal for medium KPS with low accuracy', () => {
      const stats: GameStats = {
        kps: 3.0,
        totalKeystrokes: 30,
        accuracy: 70,
        completedWords: 7,
        successfulWords: 5,
        failedWords: 2,
        totalWords: 10,
        totalTime: 10,
        avgReactionTime: 200,
        firstKeyAccuracy: 80,
        wordPerformances: [],
      }
      expect(recommendDifficulty(stats)).toBe('easy')
    })

    it('should recommend hard for high KPS with high accuracy', () => {
      const stats: GameStats = {
        kps: 5.0,
        totalKeystrokes: 50,
        accuracy: 90,
        completedWords: 9,
        successfulWords: 8,
        failedWords: 1,
        totalWords: 10,
        totalTime: 10,
        avgReactionTime: 200,
        firstKeyAccuracy: 95,
        wordPerformances: [],
      }
      expect(recommendDifficulty(stats)).toBe('hard')
    })

    it('should recommend hard for high KPS with medium accuracy', () => {
      const stats: GameStats = {
        kps: 5.0,
        totalKeystrokes: 50,
        accuracy: 80,
        completedWords: 8,
        successfulWords: 6,
        failedWords: 2,
        totalWords: 10,
        totalTime: 10,
        avgReactionTime: 200,
        firstKeyAccuracy: 85,
        wordPerformances: [],
      }
      expect(recommendDifficulty(stats)).toBe('normal')
    })

    it('should recommend expert for very high KPS with high accuracy', () => {
      const stats: GameStats = {
        kps: 7.0,
        totalKeystrokes: 70,
        accuracy: 92,
        completedWords: 9,
        successfulWords: 8,
        failedWords: 1,
        totalWords: 10,
        totalTime: 10,
        avgReactionTime: 200,
        firstKeyAccuracy: 95,
        wordPerformances: [],
      }
      expect(recommendDifficulty(stats)).toBe('expert')
    })

    it('should recommend hard for very high KPS with medium accuracy', () => {
      const stats: GameStats = {
        kps: 7.0,
        totalKeystrokes: 70,
        accuracy: 85,
        completedWords: 8,
        successfulWords: 7,
        failedWords: 1,
        totalWords: 10,
        totalTime: 10,
        avgReactionTime: 200,
        firstKeyAccuracy: 90,
        wordPerformances: [],
      }
      expect(recommendDifficulty(stats)).toBe('hard')
    })

    it('should recommend expert for extremely high KPS', () => {
      const stats: GameStats = {
        kps: 9.0,
        totalKeystrokes: 90,
        accuracy: 95,
        completedWords: 9,
        successfulWords: 9,
        failedWords: 0,
        totalWords: 10,
        totalTime: 10,
        avgReactionTime: 200,
        firstKeyAccuracy: 100,
        wordPerformances: [],
      }
      expect(recommendDifficulty(stats)).toBe('expert')
    })
  })

  describe('getSkillCheckDescription', () => {
    const createMockStats = (kps: number, accuracy: number): GameStats => ({
      kps,
      totalKeystrokes: kps * 10,
      accuracy,
      completedWords: Math.floor((accuracy / 100) * 10),
      successfulWords: Math.floor((accuracy / 100) * 8),
      failedWords: 10 - Math.floor((accuracy / 100) * 8),
      totalWords: 10,
      totalTime: 10,
      avgReactionTime: 200,
      firstKeyAccuracy: accuracy,
      wordPerformances: [],
    })

    it('should generate Japanese description for easy', () => {
      const stats = createMockStats(2.0, 70)
      const description = getSkillCheckDescription(stats, 'easy', true)
      expect(description).toContain('KPS')
      expect(description).toContain('正確率')
      expect(description).toContain('やさしい')
    })

    it('should generate Japanese description for normal', () => {
      const stats = createMockStats(4.0, 85)
      const description = getSkillCheckDescription(stats, 'normal', true)
      expect(description).toContain('ふつう')
    })

    it('should generate Japanese description for hard', () => {
      const stats = createMockStats(6.0, 88)
      const description = getSkillCheckDescription(stats, 'hard', true)
      expect(description).toContain('むずかしい')
    })

    it('should generate Japanese description for expert', () => {
      const stats = createMockStats(8.0, 95)
      const description = getSkillCheckDescription(stats, 'expert', true)
      expect(description).toContain('エキスパート')
    })

    it('should generate English description for easy', () => {
      const stats = createMockStats(2.0, 70)
      const description = getSkillCheckDescription(stats, 'easy', false)
      expect(description).toContain('KPS')
      expect(description).toContain('accuracy')
      expect(description).toContain('Easy')
    })

    it('should generate English description for normal', () => {
      const stats = createMockStats(4.0, 85)
      const description = getSkillCheckDescription(stats, 'normal', false)
      expect(description).toContain('Normal')
    })

    it('should generate English description for hard', () => {
      const stats = createMockStats(6.0, 88)
      const description = getSkillCheckDescription(stats, 'hard', false)
      expect(description).toContain('Hard')
    })

    it('should generate English description for expert', () => {
      const stats = createMockStats(8.0, 95)
      const description = getSkillCheckDescription(stats, 'expert', false)
      expect(description).toContain('Expert')
    })

    it('should include stats in description', () => {
      const stats = createMockStats(5.5, 90)
      const description = getSkillCheckDescription(stats, 'hard', true)
      expect(description).toContain('5.5')
      expect(description).toContain('90')
    })
  })
})
