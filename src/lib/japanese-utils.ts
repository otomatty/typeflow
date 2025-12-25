import * as wanakana from 'wanakana'

/**
 * Check if text contains kanji characters.
 */
export function containsKanji(text: string): boolean {
  // Kanji Unicode range: \u4E00-\u9FAF (CJK Unified Ideographs)
  // Also include \u3400-\u4DBF (CJK Unified Ideographs Extension A)
  return /[\u3400-\u4DBF\u4E00-\u9FAF]/.test(text)
}

/**
 * Check if text is primarily English/ASCII (no Japanese characters).
 */
export function isEnglishText(text: string): boolean {
  // Check if text contains any Japanese characters (hiragana, katakana, or kanji)
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FAF]/.test(text)
  return !hasJapanese
}

/**
 * Check if text contains hiragana.
 */
export function containsHiragana(text: string): boolean {
  return /[\u3040-\u309F]/.test(text)
}

/**
 * Check if text contains katakana.
 */
export function containsKatakana(text: string): boolean {
  return /[\u30A0-\u30FF]/.test(text)
}

/**
 * Convert katakana to hiragana.
 */
export function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30A0-\u30FF]/g, char => {
    return String.fromCharCode(char.charCodeAt(0) - 0x60)
  })
}

/**
 * Convert hiragana to romaji using wanakana.
 */
export function hiraganaToRomaji(text: string): string {
  return wanakana.toRomaji(text)
}

/**
 * Process text for typing practice.
 * - If text is romaji/English: returns as-is for romaji
 * - If text contains hiragana/katakana: converts to romaji
 * - If text contains kanji: user needs to provide reading manually
 */
export function processTextForTyping(
  text: string,
  manualReading?: string
): {
  reading: string
  romaji: string
  needsManualReading: boolean
} {
  const trimmedText = text.trim()

  // If manual reading is provided, use it
  if (manualReading && manualReading.trim()) {
    const reading = manualReading.trim()
    // Convert katakana to hiragana if present
    const hiraganaReading = containsKatakana(reading) ? katakanaToHiragana(reading) : reading
    const romaji = hiraganaToRomaji(hiraganaReading)
    return {
      reading: hiraganaReading,
      romaji: romaji || hiraganaReading.toLowerCase(),
      needsManualReading: false,
    }
  }

  // Check if text contains kanji
  if (containsKanji(trimmedText)) {
    return {
      reading: '',
      romaji: '',
      needsManualReading: true,
    }
  }

  // Check if text is hiragana or katakana
  if (containsHiragana(trimmedText) || containsKatakana(trimmedText)) {
    const hiraganaText = containsKatakana(trimmedText)
      ? katakanaToHiragana(trimmedText)
      : trimmedText
    const romaji = hiraganaToRomaji(hiraganaText)
    return {
      reading: hiraganaText,
      romaji: romaji || hiraganaText.toLowerCase(),
      needsManualReading: false,
    }
  }

  // Text is likely romaji/English
  return {
    reading: trimmedText,
    romaji: trimmedText.toLowerCase(),
    needsManualReading: false,
  }
}
