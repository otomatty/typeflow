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

// Canonical form -> all valid input variations
// The first element should be the canonical (standard) form
const ROMAJI_VARIANTS: Record<string, string[]> = {
  // し行 (shi-row)
  'shi': ['shi', 'si'],
  'sha': ['sha', 'sya'],
  'shu': ['shu', 'syu'],
  'sho': ['sho', 'syo'],
  
  // ち行 (chi-row)
  'chi': ['chi', 'ti'],
  'cha': ['cha', 'tya', 'cya'],
  'chu': ['chu', 'tyu', 'cyu'],
  'cho': ['cho', 'tyo', 'cyo'],
  
  // つ (tsu)
  'tsu': ['tsu', 'tu'],
  
  // ふ (fu)
  'fu': ['fu', 'hu'],
  
  // じ行 (ji-row)
  'ji': ['ji', 'zi'],
  'ja': ['ja', 'zya', 'jya'],
  'ju': ['ju', 'zyu', 'jyu'],
  'jo': ['jo', 'zyo', 'jyo'],
  
  // ぢ行 (di-row) - less common
  'di': ['di', 'ji'],
  'du': ['du', 'zu'],
  
  // を (wo)
  'wo': ['wo', 'o'],
  
  // 小文字 (small characters)
  'xtu': ['xtu', 'ltu', 'xtsu', 'ltsu'],
  'xya': ['xya', 'lya'],
  'xyu': ['xyu', 'lyu'],
  'xyo': ['xyo', 'lyo'],
  'xa': ['xa', 'la'],
  'xi': ['xi', 'li'],
  'xu': ['xu', 'lu'],
  'xe': ['xe', 'le'],
  'xo': ['xo', 'lo'],
}

// Sort by length (longest first) for proper matching
const SORTED_CANONICAL_FORMS = Object.keys(ROMAJI_VARIANTS).sort((a, b) => b.length - a.length)

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
      // End of string OR followed by vowel/y/n/' - must use 'xn'
      for (const restVar of restVariations) {
        result.push('xn' + restVar)
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
        result.push('n' + restVar)  // n alone is acceptable before consonant
        result.push('xn' + restVar) // xn is also acceptable
      }
      
      return result
    }
  }

  // Special handling for trailing 'n' (末尾の「ん」)
  // If target is just 'n', it represents ん at the end of the word - require 'xn'
  if (target === 'n') {
    return ['xn']
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
 */
export function getMatchingVariation(target: string, input: string): string | null {
  const normalizedTarget = normalizeRomaji(target)
  const normalizedInput = normalizeRomaji(input)

  if (normalizedInput.length === 0) {
    // Return the first (canonical) variation
    const variations = getCachedVariations(normalizedTarget)
    return variations.length > 0 ? variations[0] : normalizedTarget
  }

  const variations = getCachedVariations(normalizedTarget)

  for (const variation of variations) {
    if (variation.startsWith(normalizedInput)) {
      return variation
    }
  }

  return null
}

export function validateRomajiInput(target: string, input: string): {
  isCorrect: boolean
  progress: number
  expectedNext: string[]
} {
  const normalizedTarget = normalizeRomaji(target)
  const normalizedInput = normalizeRomaji(input)

  // Empty input is valid (no progress yet)
  if (normalizedInput.length === 0) {
    const variations = getCachedVariations(normalizedTarget)
    const expectedNext = variations.length > 0 ? [variations[0][0]] : []
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
    
    if (matchLen > 0 && (!bestMatch || matchLen > bestMatch.progress * bestMatch.variation.length)) {
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
