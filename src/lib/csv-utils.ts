import type { PresetWord, WordPreset } from './types'

/**
 * CSVテキストをパースしてPresetWord配列に変換
 * 期待するCSV形式: ワード,読み,入力例
 */
export function parseCSV(csvText: string): PresetWord[] {
  const lines = csvText.trim().split('\n')
  const words: PresetWord[] = []

  // ヘッダー行をスキップ（最初の行が「ワード」で始まる場合）
  const startIndex = lines[0]?.startsWith('ワード') ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // CSVパース（カンマを含む値に対応）
    const parts = parseCSVLine(line)

    if (parts.length >= 3) {
      const text = parts[0]
      const reading = parts[1]
      // 3列目以降のすべてをカンマで結合してromajiとして扱う
      // （romajiにカンマが含まれる場合、例: "aoisora,shiroikumo"）
      const romaji = parts.slice(2).join(',')

      // 有効なデータのみ追加
      if (text && reading && romaji) {
        words.push({
          text: text.trim(),
          reading: reading.trim(),
          romaji: romaji.trim(),
        })
      }
    }
  }

  return words
}

/**
 * CSV行をパース（クォートされた値に対応）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)

  return result
}

/**
 * CSVファイルからWordPresetを作成
 */
export function createPresetFromCSV(
  csvText: string,
  presetInfo: {
    id: string
    name: string
    description: string
    difficulty: 'easy' | 'normal' | 'hard'
  }
): WordPreset {
  const words = parseCSV(csvText)

  return {
    ...presetInfo,
    wordCount: words.length,
    words,
  }
}

/**
 * ファイルからCSVを読み込む
 */
export function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result
      if (typeof text === 'string') {
        resolve(text)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
