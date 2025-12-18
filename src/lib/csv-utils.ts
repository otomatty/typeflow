import type { PresetWord } from './types'

/**
 * CSVテキストをパースしてPresetWord配列に変換
 * 期待するCSV形式: ワード,読み,入力例
 */
export function parseCSV(csvText: string): PresetWord[] {
  try {
    if (!csvText || typeof csvText !== 'string') {
      console.warn('parseCSV: Invalid input, expected string')
      return []
    }

    const lines = csvText.trim().split('\n')
    const words: PresetWord[] = []

    // ヘッダー行をスキップ（最初の行が「ワード」で始まる場合）
    const startIndex = lines[0]?.startsWith('ワード') ? 1 : 0

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]?.trim()
      if (!line) continue

      try {
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
      } catch (lineError) {
        console.warn(`Failed to parse CSV line ${i + 1}:`, lineError)
        // 個別の行のエラーは無視して続行
        continue
      }
    }

    return words
  } catch (error) {
    console.error('Failed to parse CSV:', error)
    return []
  }
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
