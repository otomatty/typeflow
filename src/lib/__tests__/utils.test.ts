import { describe, it, expect } from 'vitest'
import { cn, shuffleArray } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      const condition = false
      expect(cn('foo', condition && 'bar', 'baz')).toBe('foo baz')
    })

    it('should merge tailwind classes', () => {
      expect(cn('px-2 py-1', 'px-4')).toContain('px-4')
    })
  })

  describe('shuffleArray', () => {
    it('should return a new array', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(original)
      expect(shuffled).not.toBe(original)
    })

    it('should contain the same elements', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(original)
      expect(shuffled.sort()).toEqual(original.sort())
    })

    it('should not modify the original array', () => {
      const original = [1, 2, 3, 4, 5]
      const originalCopy = [...original]
      shuffleArray(original)
      expect(original).toEqual(originalCopy)
    })

    it('should handle empty array', () => {
      const original: number[] = []
      const shuffled = shuffleArray(original)
      expect(shuffled).toEqual([])
      expect(shuffled).not.toBe(original)
    })
  })
})
