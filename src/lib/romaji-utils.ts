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

export function validateRomajiInput(target: string, input: string): {
  isCorrect: boolean
  progress: number
  expectedNext: string[]
} {
  const normalizedTarget = normalizeRomaji(target)
  const normalizedInput = normalizeRomaji(input)

  if (normalizedInput.length > normalizedTarget.length) {
    return { isCorrect: false, progress: 0, expectedNext: [] }
  }

  const romajiVariations: Record<string, string[]> = {
    'shi': ['shi', 'si'],
    'chi': ['chi', 'ti'],
    'tsu': ['tsu', 'tu'],
    'fu': ['fu', 'hu'],
    'ji': ['ji', 'zi'],
  }

  let targetIndex = 0
  for (let i = 0; i < normalizedInput.length; i++) {
    if (targetIndex >= normalizedTarget.length) {
      return { isCorrect: false, progress: 0, expectedNext: [] }
    }

    const targetChar = normalizedTarget[targetIndex]
    const inputChar = normalizedInput[i]

    if (targetChar === inputChar) {
      targetIndex++
      continue
    }

    let matched = false
    for (const [canonical, variants] of Object.entries(romajiVariations)) {
      if (normalizedTarget.substring(targetIndex).startsWith(canonical)) {
        for (const variant of variants) {
          if (normalizedInput.substring(i).startsWith(variant) && 
              variant.startsWith(inputChar)) {
            if (normalizedInput.substring(i, i + variant.length) === variant) {
              targetIndex += canonical.length
              i += variant.length - 1
              matched = true
              break
            }
          }
        }
        if (matched) break
      }
    }

    if (!matched) {
      return { isCorrect: false, progress: targetIndex / normalizedTarget.length, expectedNext: [targetChar] }
    }
  }

  const progress = targetIndex / normalizedTarget.length
  const isCorrect = progress === 1

  const expectedNext: string[] = []
  if (!isCorrect && targetIndex < normalizedTarget.length) {
    expectedNext.push(normalizedTarget[targetIndex])
  }

  return { isCorrect, progress, expectedNext }
}
