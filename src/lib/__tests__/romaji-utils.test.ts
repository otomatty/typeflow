import { describe, it, expect } from 'vitest'
import {
  toRomaji,
  toHiragana,
  isRomaji,
  normalizeRomaji,
  getMatchingVariation,
  validateRomajiInput,
} from '../romaji-utils'

describe('romaji-utils', () => {
  describe('toRomaji', () => {
    it('should convert hiragana to romaji', () => {
      expect(toRomaji('あいうえお')).toBe('aiueo')
      expect(toRomaji('かたかな')).toBe('katakana')
    })

    it('should convert katakana to romaji', () => {
      expect(toRomaji('アイウエオ')).toBe('aiueo')
      expect(toRomaji('カタカナ')).toBe('katakana')
    })
  })

  describe('toHiragana', () => {
    it('should convert romaji to hiragana', () => {
      expect(toHiragana('aiueo')).toBe('あいうえお')
      expect(toHiragana('katakana')).toBe('かたかな')
    })
  })

  describe('isRomaji', () => {
    it('should identify romaji text', () => {
      expect(isRomaji('aiueo')).toBe(true)
      expect(isRomaji('hello')).toBe(true)
      expect(isRomaji('あいうえお')).toBe(false)
      expect(isRomaji('漢字')).toBe(false)
    })
  })

  describe('normalizeRomaji', () => {
    it('should convert to lowercase', () => {
      expect(normalizeRomaji('HELLO')).toBe('hello')
      expect(normalizeRomaji('Hello World')).toBe('helloworld')
    })

    it('should remove whitespace', () => {
      expect(normalizeRomaji('hello world')).toBe('helloworld')
      expect(normalizeRomaji('  hello  world  ')).toBe('helloworld')
    })

    it('should handle multiple spaces', () => {
      expect(normalizeRomaji('hello    world')).toBe('helloworld')
    })
  })

  describe('getMatchingVariation', () => {
    it('should return canonical form for empty input', () => {
      const result = getMatchingVariation('shi', '')
      expect(result).toBe('shi')
    })

    it('should match valid prefix', () => {
      const result = getMatchingVariation('shiken', 'shi')
      expect(result).toBeTruthy()
      expect(result).toContain('shi')
    })

    it('should handle variant forms', () => {
      // 'shi' can be typed as 'si'
      const result = getMatchingVariation('shi', 'si')
      expect(result).toBeTruthy()
    })

    it('should return null for invalid input', () => {
      const result = getMatchingVariation('shi', 'xyz')
      expect(result).toBeNull()
    })
  })

  describe('validateRomajiInput', () => {
    it('should validate empty input', () => {
      const result = validateRomajiInput('shi', '')
      expect(result.isCorrect).toBe(false)
      expect(result.progress).toBe(0)
      expect(result.expectedNext.length).toBeGreaterThan(0)
    })

    it('should validate correct input', () => {
      const result = validateRomajiInput('shi', 'shi')
      expect(result.isCorrect).toBe(true)
      expect(result.progress).toBe(1)
    })

    it('should validate partial input', () => {
      const result = validateRomajiInput('shiken', 'shi')
      expect(result.isCorrect).toBe(false)
      expect(result.progress).toBeGreaterThan(0)
      expect(result.progress).toBeLessThan(1)
    })

    it('should handle variant forms', () => {
      // 'shi' can be typed as 'si'
      const result = validateRomajiInput('shi', 'si')
      expect(result.isCorrect).toBe(true)
    })

    it('should normalize input and target', () => {
      const result = validateRomajiInput('  SHI  ', '  si  ')
      expect(result.isCorrect).toBe(true)
    })

    it('should return expected next characters', () => {
      const result = validateRomajiInput('shiken', 'shi')
      expect(result.expectedNext.length).toBeGreaterThan(0)
    })
  })
})
