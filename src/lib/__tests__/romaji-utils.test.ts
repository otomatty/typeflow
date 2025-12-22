import { describe, it, expect } from 'vitest'
import {
  toRomaji,
  toHiragana,
  isRomaji,
  normalizeRomaji,
  getMatchingVariation,
  validateRomajiInput,
  getDisplayParts,
  toKunreiDisplay,
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
    it('should return shortest variation for empty input', () => {
      const result = getMatchingVariation('shi', '')
      // 'si' is shorter than 'shi', so it should be returned
      expect(result).toBe('si')
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

    // Tests for 「ん」 (n) input variations
    describe('n (ん) input handling', () => {
      it('should accept nn for ん before consonant', () => {
        // "anshoubangou" - 「あんしょうばんごう」
        // User types "ann" for "あん"
        const result = validateRomajiInput('anshoubangou', 'ann')
        expect(result.progress).toBeGreaterThan(0)
        // Should be valid prefix
        const matching = getMatchingVariation('anshoubangou', 'ann')
        expect(matching).toBeTruthy()
        expect(matching).toContain('nn')
      })

      it('should accept n for ん before consonant', () => {
        // "anshoubangou" - 「あんしょうばんごう」
        // User types "an" for "あん"
        const result = validateRomajiInput('anshoubangou', 'an')
        expect(result.progress).toBeGreaterThan(0)
        const matching = getMatchingVariation('anshoubangou', 'an')
        expect(matching).toBeTruthy()
      })

      it('should accept xn for ん before consonant', () => {
        // "anshoubangou" - 「あんしょうばんごう」
        // User types "axn" for "あん"
        const result = validateRomajiInput('anshoubangou', 'axn')
        expect(result.progress).toBeGreaterThan(0)
        const matching = getMatchingVariation('anshoubangou', 'axn')
        expect(matching).toBeTruthy()
      })

      it('should accept nn for ん at end of word', () => {
        // "nihon" - 「にほん」
        // User types "nihonn"
        const result = validateRomajiInput('nihon', 'nihonn')
        expect(result.isCorrect).toBe(true)
      })

      it('should accept nn for ん in the middle with nn input', () => {
        // "tenki" - 「てんき」
        // User types "tennki"
        const result = validateRomajiInput('tenki', 'tennki')
        expect(result.isCorrect).toBe(true)
      })
    })
  })

  describe('getDisplayParts', () => {
    it('should handle Hepburn input against Kunrei display (Bug 1 fix)', () => {
      // Word: "chuugoku" (中国) - Kunrei display is "tyuugoku"
      const wordRomaji = 'chuugoku'
      const initialDisplay = toKunreiDisplay(normalizeRomaji(wordRomaji)) // "tyuugoku"

      // User types "chu" in Hepburn style
      const result = getDisplayParts(wordRomaji, 'chu', initialDisplay)

      // inputPart should be "tyu" (Kunrei), not "chu" (Hepburn)
      expect(result.inputPart).toBe('tyu')
      // remainingPart should be "ugoku"
      expect(result.remainingPart).toBe('ugoku')
      // Combined should equal initialDisplay
      expect(result.inputPart + result.remainingPart).toBe(initialDisplay)
    })

    it('should return consistent Kunrei format for both parts (Bug 2 fix)', () => {
      // Word: "sushi" (寿司) - Kunrei display is "susi"
      const wordRomaji = 'sushi'
      const initialDisplay = toKunreiDisplay(normalizeRomaji(wordRomaji)) // "susi"

      // User types "su" (complete syllable)
      const result = getDisplayParts(wordRomaji, 'su', initialDisplay)

      // Both parts should be in Kunrei format
      expect(result.inputPart).toBe('su')
      expect(result.remainingPart).toBe('si') // Not "shi"
      expect(result.inputPart + result.remainingPart).toBe(initialDisplay)
    })

    it('should handle complete Hepburn input correctly', () => {
      // Word: "chikyuu" (地球) - Kunrei display is "tikyuu"
      const wordRomaji = 'chikyuu'
      const initialDisplay = toKunreiDisplay(normalizeRomaji(wordRomaji)) // "tikyuu"

      // User types "chi" in Hepburn
      const result = getDisplayParts(wordRomaji, 'chi', initialDisplay)

      expect(result.inputPart).toBe('ti')
      expect(result.remainingPart).toBe('kyuu')
      expect(result.inputPart + result.remainingPart).toBe(initialDisplay)
    })

    it('should handle empty input', () => {
      const wordRomaji = 'sushi'
      const initialDisplay = toKunreiDisplay(normalizeRomaji(wordRomaji))

      const result = getDisplayParts(wordRomaji, '', initialDisplay)

      expect(result.inputPart).toBe('')
      expect(result.remainingPart).toBe(initialDisplay)
    })

    it('should handle Kunrei input matching Kunrei display directly', () => {
      // User types in Kunrei style, should work directly
      const wordRomaji = 'sushi'
      const initialDisplay = toKunreiDisplay(normalizeRomaji(wordRomaji)) // "susi"

      // User types "susi" (complete word in Kunrei)
      const result = getDisplayParts(wordRomaji, 'susi', initialDisplay)

      expect(result.inputPart).toBe('susi')
      expect(result.remainingPart).toBe('')
    })

    it('should handle fu/hu conversion', () => {
      const wordRomaji = 'fuji'
      const initialDisplay = toKunreiDisplay(normalizeRomaji(wordRomaji)) // "huji"

      const result = getDisplayParts(wordRomaji, 'fu', initialDisplay)

      expect(result.inputPart).toBe('hu')
      expect(result.remainingPart).toBe('ji')
      expect(result.inputPart + result.remainingPart).toBe(initialDisplay)
    })
  })
})
