import { describe, it, expect } from 'vitest'
import {
  calculateNextInterval,
  calculateNextReviewAt,
  updateMasteryLevel,
  calculateTimeDecayScore,
  calculateNoveltyScore,
  calculateWordDifficulty,
  applyWarmupBoost,
  applyDuplicationPenalty,
  calculateDifficultyAdjustment,
  getWeightsForPracticeMode,
  MAX_MASTERY_LEVEL,
} from '../srs-utils'

describe('srs-utils', () => {
  describe('calculateNextInterval', () => {
    it('should calculate interval for level 0', () => {
      const interval = calculateNextInterval(0)
      expect(interval).toBe(1 * 60 * 60 * 1000) // 1 hour
    })

    it('should calculate interval for level 1', () => {
      const interval = calculateNextInterval(1)
      expect(interval).toBe(6 * 60 * 60 * 1000) // 6 hours
    })

    it('should cap at max level', () => {
      const interval = calculateNextInterval(MAX_MASTERY_LEVEL + 10)
      expect(interval).toBeGreaterThan(0)
    })
  })

  describe('calculateNextReviewAt', () => {
    it('should calculate next review time', () => {
      const currentTime = Date.now()
      const reviewAt = calculateNextReviewAt(0, currentTime)
      expect(reviewAt).toBe(currentTime + 1 * 60 * 60 * 1000)
    })

    it('should use current time by default', () => {
      const before = Date.now()
      const reviewAt = calculateNextReviewAt(0)
      const after = Date.now()
      expect(reviewAt).toBeGreaterThanOrEqual(before + 1 * 60 * 60 * 1000)
      expect(reviewAt).toBeLessThanOrEqual(after + 1 * 60 * 60 * 1000)
    })
  })

  describe('updateMasteryLevel', () => {
    it('should increase level on correct answer', () => {
      const result = updateMasteryLevel(0, true, 0)
      expect(result.newLevel).toBeGreaterThan(0)
      expect(result.newConsecutiveCorrect).toBeGreaterThanOrEqual(0)
    })

    it('should require consecutive correct for level up', () => {
      const result1 = updateMasteryLevel(1, true, 0)
      expect(result1.newLevel).toBe(1) // No level up yet

      const result2 = updateMasteryLevel(1, true, 1)
      expect(result2.newLevel).toBeGreaterThan(1) // Level up
    })

    it('should decrease level on incorrect answer', () => {
      const result = updateMasteryLevel(3, false, 5)
      expect(result.newLevel).toBe(1) // Decreased by 2
      expect(result.newConsecutiveCorrect).toBe(0)
    })

    it('should not go below level 0', () => {
      const result = updateMasteryLevel(0, false, 0)
      expect(result.newLevel).toBe(0)
    })

    it('should cap at max level', () => {
      const result = updateMasteryLevel(MAX_MASTERY_LEVEL, true, 2)
      expect(result.newLevel).toBeLessThanOrEqual(MAX_MASTERY_LEVEL)
    })
  })

  describe('calculateTimeDecayScore', () => {
    it('should return 1.0 for unplayed words', () => {
      const score = calculateTimeDecayScore(0, 0)
      expect(score).toBe(1.0)
    })

    it('should return low score for recently played words', () => {
      const now = Date.now()
      const recentlyPlayed = now - 1000 // 1 second ago
      const score = calculateTimeDecayScore(recentlyPlayed, 1)
      expect(score).toBeLessThan(0.5)
    })

    it('should return high score when review time is near', () => {
      const now = Date.now()
      const interval = calculateNextInterval(1)
      const nearReviewTime = now - interval * 0.8
      const score = calculateTimeDecayScore(nearReviewTime, 1, now)
      expect(score).toBeGreaterThan(0.7)
    })

    it('should return 1.0 at optimal review time', () => {
      const now = Date.now()
      const interval = calculateNextInterval(1)
      const optimalTime = now - interval * 1.5
      const score = calculateTimeDecayScore(optimalTime, 1, now)
      expect(score).toBe(1.0)
    })
  })

  describe('calculateNoveltyScore', () => {
    it('should return 1.0 for unplayed words', () => {
      expect(calculateNoveltyScore(0)).toBe(1.0)
    })

    it('should return high score for few attempts', () => {
      expect(calculateNoveltyScore(1)).toBeGreaterThan(0.5)
      expect(calculateNoveltyScore(2)).toBeGreaterThan(0.3)
    })

    it('should return low score for many attempts', () => {
      expect(calculateNoveltyScore(10)).toBe(0.1)
      expect(calculateNoveltyScore(20)).toBe(0.1)
    })
  })

  describe('calculateWordDifficulty', () => {
    it('should calculate difficulty based on length', () => {
      const difficulty = calculateWordDifficulty('a'.repeat(20), new Set(), new Set())
      expect(difficulty).toBeGreaterThanOrEqual(0.3)
    })

    it('should increase difficulty with weak keys', () => {
      const weakKeys = new Set(['a', 'b'])
      const difficulty1 = calculateWordDifficulty('abc', weakKeys, new Set())
      const difficulty2 = calculateWordDifficulty('xyz', new Set(), new Set())
      expect(difficulty1).toBeGreaterThan(difficulty2)
    })

    it('should increase difficulty with weak transitions', () => {
      const weakTransitions = new Set(['a->b'])
      const difficulty1 = calculateWordDifficulty('abc', new Set(), weakTransitions)
      const difficulty2 = calculateWordDifficulty('xyz', new Set(), new Set())
      expect(difficulty1).toBeGreaterThan(difficulty2)
    })

    it('should cap difficulty at 1.0', () => {
      const weakKeys = new Set('abcdefghijklmnopqrstuvwxyz'.split(''))
      const difficulty = calculateWordDifficulty('abcdefghijklmnopqrstuvwxyz', weakKeys, new Set())
      expect(difficulty).toBeLessThanOrEqual(1.0)
    })
  })

  describe('applyWarmupBoost', () => {
    it('should boost easy words during warmup', () => {
      const boost = applyWarmupBoost(0, 100, 0.3) // Easy word at start
      expect(boost).toBeGreaterThan(0.5)
    })

    it('should not boost after warmup', () => {
      const boost = applyWarmupBoost(20, 100, 0.3) // After warmup
      expect(boost).toBe(0.5)
    })
  })

  describe('applyDuplicationPenalty', () => {
    it('should return 0.0 for recent words', () => {
      const penalty = applyDuplicationPenalty('word1', ['word1', 'word2'], new Set())
      expect(penalty).toBe(0.0)
    })

    it('should return 0.7 for session words', () => {
      const sessionWords = new Set(['word1'])
      const penalty = applyDuplicationPenalty('word1', [], sessionWords)
      expect(penalty).toBe(0.7)
    })

    it('should return 1.0 for new words', () => {
      const penalty = applyDuplicationPenalty('word1', [], new Set())
      expect(penalty).toBe(1.0)
    })
  })

  describe('calculateDifficultyAdjustment', () => {
    it('should favor hard words when performance is good', () => {
      const adjustment = calculateDifficultyAdjustment(0.95, 0.7) // High correct rate, hard word
      expect(adjustment).toBe(0.8)
    })

    it('should favor easy words when performance is poor', () => {
      const adjustment = calculateDifficultyAdjustment(0.4, 0.3) // Low correct rate, easy word
      expect(adjustment).toBe(0.8)
    })

    it('should return balanced adjustment for normal performance', () => {
      const adjustment = calculateDifficultyAdjustment(0.7, 0.5)
      expect(adjustment).toBe(0.5)
    })
  })

  describe('getWeightsForPracticeMode', () => {
    it('should return weights for weakness-focus mode', () => {
      const weights = getWeightsForPracticeMode('weakness-focus')
      expect(weights.weakness).toBe(0.85)
      expect(weights.timeDecay).toBe(0.0)
    })

    it('should return weights for review mode', () => {
      const weights = getWeightsForPracticeMode('review')
      expect(weights.timeDecay).toBe(0.9)
      expect(weights.weakness).toBe(0.0)
    })

    it('should return weights for random mode', () => {
      const weights = getWeightsForPracticeMode('random')
      expect(weights.random).toBe(1.0)
      expect(weights.weakness).toBe(0.0)
    })

    it('should default to random mode', () => {
      const weights = getWeightsForPracticeMode('unknown')
      expect(weights.random).toBe(1.0)
    })
  })
})
