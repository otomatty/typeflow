import { describe, it, expect } from 'vitest'
import { parseCSV, createPresetFromCSV, readCSVFile } from '../csv-utils'

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

  describe('createPresetFromCSV', () => {
    it('should create preset from CSV', () => {
      const csv = `あいうえお,あいうえお,aiueo
かきくけこ,かきくけこ,kakikukeko`
      const preset = createPresetFromCSV(csv, {
        id: 'test',
        name: 'Test Preset',
        description: 'Test',
        difficulty: 'normal',
      })

      expect(preset.id).toBe('test')
      expect(preset.name).toBe('Test Preset')
      expect(preset.difficulty).toBe('normal')
      expect(preset.wordCount).toBe(2)
      expect(preset.words).toHaveLength(2)
    })
  })

  describe('readCSVFile', () => {
    it('should read CSV file', async () => {
      const csvContent = 'あいうえお,あいうえお,aiueo'
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })

      const result = await readCSVFile(file)
      expect(result).toBe(csvContent)
    })

    it('should reject on file read error', async () => {
      // Create a mock file that will fail to read
      const file = new File([], 'test.csv', { type: 'text/csv' })
      // Override FileReader to simulate error
      const originalFileReader = global.FileReader
      global.FileReader = class {
        readAsText() {
          setTimeout(() => {
            // @ts-expect-error - accessing private property for test
            this.onerror(new Error('Read error'))
          }, 0)
        }
      } as any

      await expect(readCSVFile(file)).rejects.toThrow()

      global.FileReader = originalFileReader
    })
  })
})
