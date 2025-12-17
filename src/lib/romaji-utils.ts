import * as wanakana from 'wanakana'

export function toRomaji(text: string): string {
  return wanakana.toRomaji(text, { customRomajiMapping: {} })
}

export function toHiragana(text: string): string {
  return wanakana.toHiragana(text)
}

export function isRomaji(text: string): boolean {
  return wanakana.isRomaji(text)
}

export function normalizeRomaji(input: string): string {
  return input.toLowerCase().replace(/\s+/g, '')
}

// ヘボン式 → 訓令式への変換マッピング（表示用）
// 長いものから順にマッチさせる必要があるため、長さ順にソート
const KUNREI_DISPLAY_MAPPINGS: [string, string][] = [
  // ち行拗音
  ['cha', 'tya'],
  ['chi', 'ti'],
  ['chu', 'tyu'],
  ['cho', 'tyo'],
  // し行拗音
  ['sha', 'sya'],
  ['shi', 'si'],
  ['shu', 'syu'],
  ['sho', 'syo'],
  // じ行はヘボン式（ja, ji, ju, jo）のまま
  // つ・ふ
  ['tsu', 'tu'],
  ['fu', 'hu'],
]

/**
 * ヘボン式ローマ字を訓令式に変換して表示用に使用する
 * 例: "chuugoku" → "tyuugoku"
 */
export function toKunreiDisplay(romaji: string): string {
  let result = romaji.toLowerCase()
  for (const [hepburn, kunrei] of KUNREI_DISPLAY_MAPPINGS) {
    result = result.split(hepburn).join(kunrei)
  }
  return result
}

/**
 * 入力済み部分と未入力部分を分離して返す
 * 入力済み部分はユーザーの入力をそのまま使用
 * 未入力部分は初期表示（訓令式）から取得
 */
export function getDisplayParts(
  wordRomaji: string,
  currentInput: string,
  initialDisplay: string
): { inputPart: string; remainingPart: string } {
  const normalizedInput = normalizeRomaji(currentInput)

  if (normalizedInput.length === 0) {
    return { inputPart: '', remainingPart: initialDisplay }
  }

  // 入力が初期表示のプレフィックスの場合、そのまま初期表示を使用
  if (initialDisplay.startsWith(normalizedInput)) {
    return {
      inputPart: normalizedInput,
      remainingPart: initialDisplay.substring(normalizedInput.length),
    }
  }

  // 入力にマッチするバリエーションを取得
  const matchingVariation = getMatchingVariation(wordRomaji, currentInput)
  if (!matchingVariation) {
    return {
      inputPart: normalizedInput,
      remainingPart: initialDisplay.substring(normalizedInput.length),
    }
  }

  // 入力が母音で終わっている場合（完成した音節）
  const lastChar = normalizedInput[normalizedInput.length - 1]
  if ('aiueon'.includes(lastChar)) {
    // マッチするバリエーションの残りを訓令式に変換
    const remainingFromVariation = matchingVariation.substring(normalizedInput.length)
    const remainingKunrei = toKunreiDisplay(remainingFromVariation)

    // 初期表示の末尾から同じ長さの部分を取得
    const startIndex = initialDisplay.length - remainingKunrei.length
    if (startIndex >= 0) {
      const remainingFromInitial = initialDisplay.substring(startIndex)
      // 訓令式に変換した残りと一致するか確認
      if (remainingFromInitial === remainingKunrei) {
        return { inputPart: normalizedInput, remainingPart: remainingFromInitial }
      }
    }
  }

  // 入力が音節の途中の場合、またはマッチしない場合はマッチするバリエーションを使用
  return {
    inputPart: normalizedInput,
    remainingPart: matchingVariation.substring(normalizedInput.length),
  }
}

// Canonical form -> all valid input variations
// The first element should be the canonical (standard) form
const ROMAJI_VARIANTS: Record<string, string[]> = {
  // し行 (shi-row)
  shi: ['shi', 'si'],
  sha: ['sha', 'sya'],
  shu: ['shu', 'syu'],
  sho: ['sho', 'syo'],

  // ち行 (chi-row)
  chi: ['chi', 'ti'],
  cha: ['cha', 'tya', 'cya'],
  chu: ['chu', 'tyu', 'cyu'],
  cho: ['cho', 'tyo', 'cyo'],

  // つ (tsu)
  tsu: ['tsu', 'tu'],

  // ふ (fu)
  fu: ['fu', 'hu'],

  // じ行 (ji-row)
  ji: ['ji', 'zi'],
  ja: ['ja', 'zya', 'jya'],
  ju: ['ju', 'zyu', 'jyu'],
  jo: ['jo', 'zyo', 'jyo'],

  // ぢ行 (di-row) - less common
  di: ['di', 'ji'],
  du: ['du', 'zu'],

  // を (wo) - only 'wo' is valid, 'o' is for お
  wo: ['wo'],

  // 小文字 (small characters)
  xtu: ['xtu', 'ltu', 'xtsu', 'ltsu'],
  xya: ['xya', 'lya'],
  xyu: ['xyu', 'lyu'],
  xyo: ['xyo', 'lyo'],
  xa: ['xa', 'la'],
  xi: ['xi', 'li'],
  xu: ['xu', 'lu'],
  xe: ['xe', 'le'],
  xo: ['xo', 'lo'],
}

// Sort by length (longest first) for proper matching
const SORTED_CANONICAL_FORMS = Object.keys(ROMAJI_VARIANTS).sort((a, b) => b.length - a.length)

// Create reverse mapping: variant -> canonical form
// This allows us to normalize variant forms (tya, cya) to canonical forms (cha)
const VARIANT_TO_CANONICAL: Record<string, string> = {}
for (const [canonical, variants] of Object.entries(ROMAJI_VARIANTS)) {
  for (const variant of variants) {
    if (variant !== canonical) {
      VARIANT_TO_CANONICAL[variant] = canonical
    }
  }
}

// Characters that require xn before them (vowels, y, n')
// When 'n' is followed by these characters, it needs to be distinguished from 'na', 'ni', etc.
const VOWELS_AND_SPECIAL = new Set(['a', 'i', 'u', 'e', 'o', 'y', 'n', "'"])

/**
 * Generate all valid input variations for a target romaji string.
 * For example: "shiken" -> ["shiken", "siken"]
 *
 * Special handling for 'n' (ん):
 * - If followed by consonant or at end: 'n' alone is acceptable
 * - If followed by vowel, y, n, or ': use 'xn' (nn is inefficient so excluded)
 */
function generateAllVariations(target: string): string[] {
  if (target.length === 0) {
    return ['']
  }

  // Special handling for 'xn' (explicit ん)
  if (target.startsWith('xn')) {
    const rest = target.substring(2)
    const restVariations = generateAllVariations(rest)
    const result: string[] = []

    // xn can be typed as: xn, nn (but nn is inefficient, so we only use xn and n when applicable)
    const nextChar = rest[0]

    if (nextChar && !VOWELS_AND_SPECIAL.has(nextChar.toLowerCase())) {
      // Followed by consonant - both 'n' and 'xn' work
      for (const restVar of restVariations) {
        result.push('n' + restVar)
        result.push('xn' + restVar)
      }
    } else {
      // End of string OR followed by vowel/y/n/' - both 'xn' and 'nn' work
      for (const restVar of restVariations) {
        result.push('xn' + restVar)
        result.push('nn' + restVar)
      }
    }

    return result
  }

  // Try to match canonical forms at the current position
  for (const canonical of SORTED_CANONICAL_FORMS) {
    if (target.startsWith(canonical)) {
      const rest = target.substring(canonical.length)
      const restVariations = generateAllVariations(rest)
      const result: string[] = []

      for (const variant of ROMAJI_VARIANTS[canonical]) {
        for (const restVar of restVariations) {
          result.push(variant + restVar)
        }
      }

      return result
    }
  }

  // Try to match variant forms and convert them to canonical forms
  // This handles cases where the target romaji uses variant forms (e.g., "tya" instead of "cha")
  for (const variant of Object.keys(VARIANT_TO_CANONICAL)) {
    if (target.startsWith(variant)) {
      const canonical = VARIANT_TO_CANONICAL[variant]
      const rest = target.substring(variant.length)
      const restVariations = generateAllVariations(rest)
      const result: string[] = []

      // Generate all variations for the canonical form
      for (const variantForm of ROMAJI_VARIANTS[canonical]) {
        for (const restVar of restVariations) {
          result.push(variantForm + restVar)
        }
      }

      return result
    }
  }

  // Special handling for 'n' that might represent ん
  // This handles cases where the romaji data uses 'n' before consonants (e.g., 'anshoubangou')
  if (target[0] === 'n' && target.length >= 2) {
    const nextChar = target[1]

    // Check if this 'n' could be ん (followed by consonant, not vowel/y/n/')
    // Note: 'na', 'ni', 'nu', 'ne', 'no' are regular n+vowel, not ん
    if (!VOWELS_AND_SPECIAL.has(nextChar.toLowerCase())) {
      // This 'n' before consonant could be ん - allow both 'n' and 'xn'
      const rest = target.substring(1)
      const restVariations = generateAllVariations(rest)
      const result: string[] = []

      for (const restVar of restVariations) {
        result.push('n' + restVar) // n alone is acceptable before consonant
        result.push('xn' + restVar) // xn is also acceptable
      }

      return result
    }
  }

  // Special handling for trailing 'n' (末尾の「ん」)
  // If target is just 'n', it represents ん at the end of the word - allow 'xn' or 'nn'
  if (target === 'n') {
    return ['xn', 'nn']
  }

  // No canonical form matched - take single character and continue
  const firstChar = target[0]
  const rest = target.substring(1)
  const restVariations = generateAllVariations(rest)

  return restVariations.map(restVar => firstChar + restVar)
}

// Cache for generated variations to improve performance
const variationCache = new Map<string, string[]>()

function getCachedVariations(target: string): string[] {
  const cached = variationCache.get(target)
  if (cached) {
    return cached
  }

  const variations = generateAllVariations(target)
  variationCache.set(target, variations)
  return variations
}

/**
 * Get the variation that matches the current input.
 * Returns the matching variation string or null if no match.
 * When input is empty, returns the shortest variation for display.
 */
export function getMatchingVariation(target: string, input: string): string | null {
  const normalizedTarget = normalizeRomaji(target)
  const normalizedInput = normalizeRomaji(input)

  if (normalizedInput.length === 0) {
    // Return the shortest variation for display (to minimize character count)
    const variations = getCachedVariations(normalizedTarget)
    if (variations.length === 0) {
      return normalizedTarget
    }
    // Find the shortest variation
    return variations.reduce((shortest, current) =>
      current.length < shortest.length ? current : shortest
    )
  }

  const variations = getCachedVariations(normalizedTarget)

  for (const variation of variations) {
    if (variation.startsWith(normalizedInput)) {
      return variation
    }
  }

  return null
}

export function validateRomajiInput(
  target: string,
  input: string
): {
  isCorrect: boolean
  progress: number
  expectedNext: string[]
} {
  const normalizedTarget = normalizeRomaji(target)
  const normalizedInput = normalizeRomaji(input)

  // Empty input is valid (no progress yet)
  if (normalizedInput.length === 0) {
    const variations = getCachedVariations(normalizedTarget)
    if (variations.length === 0) {
      return { isCorrect: false, progress: 0, expectedNext: [] }
    }
    // Use the shortest variation for expected next character
    const shortestVariation = variations.reduce((shortest, current) =>
      current.length < shortest.length ? current : shortest
    )
    const expectedNext = shortestVariation.length > 0 ? [shortestVariation[0]] : []
    return { isCorrect: false, progress: 0, expectedNext }
  }

  // Get all valid variations for the target
  const variations = getCachedVariations(normalizedTarget)

  // Check if input is a valid prefix of any variation
  let bestMatch: { variation: string; progress: number } | null = null

  for (const variation of variations) {
    if (variation.startsWith(normalizedInput)) {
      // Exact prefix match
      const progress = normalizedInput.length / variation.length
      const isCorrect = normalizedInput === variation

      // Get next expected character(s)
      const expectedNext: string[] = []
      if (!isCorrect && normalizedInput.length < variation.length) {
        expectedNext.push(variation[normalizedInput.length])
      }

      return { isCorrect, progress, expectedNext }
    }

    // Track partial matches for progress calculation
    // Find how many characters match from the start
    let matchLen = 0
    for (let i = 0; i < Math.min(normalizedInput.length, variation.length); i++) {
      if (normalizedInput[i] === variation[i]) {
        matchLen++
      } else {
        break
      }
    }

    if (
      matchLen > 0 &&
      (!bestMatch || matchLen > bestMatch.progress * bestMatch.variation.length)
    ) {
      bestMatch = { variation, progress: matchLen / variation.length }
    }
  }

  // No valid prefix match found - input is invalid
  // Return progress based on best partial match (if any)
  const progress = bestMatch ? bestMatch.progress : 0
  const expectedNext: string[] = []

  if (bestMatch && bestMatch.progress * bestMatch.variation.length < bestMatch.variation.length) {
    const matchedLen = Math.floor(bestMatch.progress * bestMatch.variation.length)
    if (matchedLen < bestMatch.variation.length) {
      expectedNext.push(bestMatch.variation[matchedLen])
    }
  }

  return { isCorrect: false, progress, expectedNext }
}
