import { describe, it, expect } from 'vitest'
import { parseCSV } from '../csv-utils'

describe('csv-utils', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV', () => {
      const csv = 'あいうえお,あいうえお,aiueo'
      const result = parseCSV(csv)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        text: 'あいうえお',
        reading: 'あいうえお',
        romaji: 'aiueo',
      })
    })

    it('should parse multiple lines', () => {
      const csv = `あいうえお,あいうえお,aiueo
かきくけこ,かきくけこ,kakikukeko`
      const result = parseCSV(csv)
      expect(result).toHaveLength(2)
    })

    it('should skip header row', () => {
      const csv = `ワード,読み,入力例
あいうえお,あいうえお,aiueo`
      const result = parseCSV(csv)
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('あいうえお')
    })

    it('should skip empty lines', () => {
      const csv = `あいうえお,あいうえお,aiueo

かきくけこ,かきくけこ,kakikukeko`
      const result = parseCSV(csv)
      expect(result).toHaveLength(2)
    })

    it('should handle quoted values', () => {
      const csv = '"あいう,えお","あいう,えお","aiu,eo"'
      const result = parseCSV(csv)
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('あいう,えお')
      expect(result[0].romaji).toBe('aiu,eo')
    })

    it('should trim whitespace', () => {
      const csv = '  あいうえお  ,  あいうえお  ,  aiueo  '
      const result = parseCSV(csv)
      expect(result[0].text).toBe('あいうえお')
      expect(result[0].reading).toBe('あいうえお')
      expect(result[0].romaji).toBe('aiueo')
    })

    it('should handle multiple columns for romaji', () => {
      const csv = 'あいうえお,あいうえお,aiu,eo'
      const result = parseCSV(csv)
      expect(result[0].romaji).toBe('aiu,eo')
    })

    it('should skip invalid rows', () => {
      const csv = `あいうえお,あいうえお,aiueo
invalid
かきくけこ,かきくけこ,kakikukeko`
      const result = parseCSV(csv)
      expect(result).toHaveLength(2)
    })
  })
})
