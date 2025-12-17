import { describe, it, expect } from 'vitest'
import {
  containsKanji,
  containsHiragana,
  containsKatakana,
  katakanaToHiragana,
  hiraganaToRomaji,
  processTextForTyping,
} from '../japanese-utils'

describe('japanese-utils', () => {
  describe('containsKanji', () => {
    it('should detect kanji characters', () => {
      expect(containsKanji('漢字')).toBe(true)
      expect(containsKanji('日本語')).toBe(true)
      expect(containsKanji('あいうえお')).toBe(false)
      expect(containsKanji('アイウエオ')).toBe(false)
      expect(containsKanji('hello')).toBe(false)
    })

    it('should handle mixed text', () => {
      expect(containsKanji('漢字とひらがな')).toBe(true)
      expect(containsKanji('カタカナと漢字')).toBe(true)
    })
  })

  describe('containsHiragana', () => {
    it('should detect hiragana characters', () => {
      expect(containsHiragana('あいうえお')).toBe(true)
      expect(containsHiragana('ひらがな')).toBe(true)
      expect(containsHiragana('アイウエオ')).toBe(false)
      expect(containsHiragana('漢字')).toBe(false)
      expect(containsHiragana('hello')).toBe(false)
    })

    it('should handle mixed text', () => {
      expect(containsHiragana('ひらがなとカタカナ')).toBe(true)
      expect(containsHiragana('漢字とひらがな')).toBe(true)
    })
  })

  describe('containsKatakana', () => {
    it('should detect katakana characters', () => {
      expect(containsKatakana('アイウエオ')).toBe(true)
      expect(containsKatakana('カタカナ')).toBe(true)
      expect(containsKatakana('あいうえお')).toBe(false)
      expect(containsKatakana('漢字')).toBe(false)
      expect(containsKatakana('hello')).toBe(false)
    })

    it('should handle mixed text', () => {
      expect(containsKatakana('カタカナとひらがな')).toBe(true)
      expect(containsKatakana('漢字とカタカナ')).toBe(true)
    })
  })

  describe('katakanaToHiragana', () => {
    it('should convert katakana to hiragana', () => {
      expect(katakanaToHiragana('アイウエオ')).toBe('あいうえお')
      expect(katakanaToHiragana('カタカナ')).toBe('かたかな')
      // 長音符（ー）の変換は実装に依存するため、基本的な変換のみテスト
      expect(katakanaToHiragana('コンピュータ')).toContain('こんぴゅ')
    })

    it('should leave hiragana unchanged', () => {
      expect(katakanaToHiragana('あいうえお')).toBe('あいうえお')
    })

    it('should handle mixed text', () => {
      expect(katakanaToHiragana('カタカナとひらがな')).toBe('かたかなとひらがな')
    })
  })

  describe('hiraganaToRomaji', () => {
    it('should convert hiragana to romaji', () => {
      expect(hiraganaToRomaji('あいうえお')).toBe('aiueo')
      expect(hiraganaToRomaji('かたかな')).toBe('katakana')
      expect(hiraganaToRomaji('こんにちは')).toBe('konnichiha')
    })
  })

  describe('processTextForTyping', () => {
    it('should process hiragana text', () => {
      const result = processTextForTyping('あいうえお')
      expect(result.reading).toBe('あいうえお')
      expect(result.romaji).toBeTruthy()
      expect(result.needsManualReading).toBe(false)
    })

    it('should process katakana text', () => {
      const result = processTextForTyping('アイウエオ')
      expect(result.reading).toBe('あいうえお')
      expect(result.romaji).toBeTruthy()
      expect(result.needsManualReading).toBe(false)
    })

    it('should process romaji/English text', () => {
      const result = processTextForTyping('hello world')
      expect(result.reading).toBe('hello world')
      expect(result.romaji).toBe('hello world')
      expect(result.needsManualReading).toBe(false)
    })

    it('should require manual reading for kanji', () => {
      const result = processTextForTyping('漢字')
      expect(result.needsManualReading).toBe(true)
      expect(result.reading).toBe('')
      expect(result.romaji).toBe('')
    })

    it('should use manual reading when provided', () => {
      const result = processTextForTyping('漢字', 'かんじ')
      expect(result.needsManualReading).toBe(false)
      expect(result.reading).toBe('かんじ')
      expect(result.romaji).toBeTruthy()
    })

    it('should convert katakana manual reading to hiragana', () => {
      const result = processTextForTyping('漢字', 'カンジ')
      expect(result.reading).toBe('かんじ')
      expect(result.romaji).toBeTruthy()
    })

    it('should trim whitespace', () => {
      const result = processTextForTyping('  あいうえお  ')
      expect(result.reading).toBe('あいうえお')
    })
  })
})
