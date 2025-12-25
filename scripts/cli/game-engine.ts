/**
 * CLI Game Engine
 * Game logic (CLI version of the existing useGame hook)
 */

import type {
  CLIWord,
  CLIGameScore,
  CLISettings,
  GameState,
  WordResult,
  GameResult,
  DisplayData,
  CLIOptions,
} from './types'
import { Display } from './display'
import { InputManager } from './input'
import { LocalDBClient, DEFAULT_SETTINGS } from './local-db'

// Romaji input validation (ported from existing logic)
function normalizeRomaji(input: string): string {
  return input.toLowerCase().replace(/\s+/g, '')
}

// Romaji variations (simplified version)
const ROMAJI_VARIANTS: Record<string, string[]> = {
  shi: ['shi', 'si'],
  sha: ['sha', 'sya'],
  shu: ['shu', 'syu'],
  sho: ['sho', 'syo'],
  chi: ['chi', 'ti'],
  cha: ['cha', 'tya', 'cya'],
  chu: ['chu', 'tyu', 'cyu'],
  cho: ['cho', 'tyo', 'cyo'],
  tsu: ['tsu', 'tu'],
  fu: ['fu', 'hu'],
  ji: ['ji', 'zi'],
  ja: ['ja', 'zya', 'jya'],
  ju: ['ju', 'zyu', 'jyu'],
  jo: ['jo', 'zyo', 'jyo'],
  wo: ['wo'],
}

const SORTED_CANONICAL_FORMS = Object.keys(ROMAJI_VARIANTS).sort((a, b) => b.length - a.length)

function generateAllVariations(target: string): string[] {
  if (target.length === 0) return ['']

  // Special handling for 'n'
  if (target.startsWith('xn')) {
    const rest = target.substring(2)
    const restVariations = generateAllVariations(rest)
    const result: string[] = []
    const nextChar = rest[0]

    if (nextChar && !'aiueony'.includes(nextChar.toLowerCase())) {
      for (const restVar of restVariations) {
        result.push('n' + restVar)
        result.push('xn' + restVar)
      }
    } else {
      for (const restVar of restVariations) {
        result.push('xn' + restVar)
        result.push('nn' + restVar)
      }
    }
    return result
  }

  // Match canonical forms
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

  // Handle 'n'
  if (target[0] === 'n' && target.length >= 2) {
    const nextChar = target[1]
    if (!'aiueony'.includes(nextChar.toLowerCase())) {
      const rest = target.substring(1)
      const restVariations = generateAllVariations(rest)
      const result: string[] = []
      for (const restVar of restVariations) {
        result.push('n' + restVar)
        result.push('xn' + restVar)
        result.push('nn' + restVar)
      }
      return result
    }
  }

  if (target === 'n') {
    return ['xn', 'nn']
  }

  const firstChar = target[0]
  const rest = target.substring(1)
  const restVariations = generateAllVariations(rest)
  return restVariations.map(restVar => firstChar + restVar)
}

const variationCache = new Map<string, string[]>()

function getCachedVariations(target: string): string[] {
  const cached = variationCache.get(target)
  if (cached) return cached

  const variations = generateAllVariations(target)
  variationCache.set(target, variations)
  return variations
}

function validateRomajiInput(
  target: string,
  input: string
): {
  isCorrect: boolean
  progress: number
} {
  const normalizedTarget = normalizeRomaji(target)
  const normalizedInput = normalizeRomaji(input)

  if (normalizedInput.length === 0) {
    return { isCorrect: false, progress: 0 }
  }

  const variations = getCachedVariations(normalizedTarget)

  for (const variation of variations) {
    if (variation.startsWith(normalizedInput)) {
      const progress = normalizedInput.length / variation.length
      const isCorrect = normalizedInput === variation
      return { isCorrect, progress }
    }
  }

  return { isCorrect: false, progress: 0 }
}

// Time calculation (ported from existing logic)
const DEFAULT_KPS = 3.0
const RECENT_SCORES_FOR_KPS = 10

function calculateAverageKps(gameScores: CLIGameScore[]): number {
  if (gameScores.length === 0) return DEFAULT_KPS

  const recentScores = [...gameScores]
    .filter(score => score.kps > 0 && score.totalTime > 0)
    .sort((a, b) => b.playedAt - a.playedAt)
    .slice(0, RECENT_SCORES_FOR_KPS)

  if (recentScores.length === 0) return DEFAULT_KPS

  const sum = recentScores.reduce((acc, score) => acc + score.kps, 0)
  return sum / recentScores.length
}

function calculateWordTimeLimit(
  word: CLIWord,
  gameScores: CLIGameScore[],
  settings: CLISettings
): number {
  const averageKps = calculateAverageKps(gameScores)
  const targetKps = averageKps * settings.targetKpsMultiplier
  const keystrokeCount = normalizeRomaji(word.romaji).length

  // Prevent division by zero and NaN
  if (targetKps <= 0 || isNaN(targetKps)) {
    return settings.minTimeLimitByDifficulty || 2.0
  }

  const theoreticalTime = keystrokeCount / targetKps
  let adjustedTime = theoreticalTime * settings.comfortZoneRatio

  adjustedTime = Math.max(settings.minTimeLimit, Math.min(settings.maxTimeLimit, adjustedTime))
  adjustedTime = Math.max(adjustedTime, settings.minTimeLimitByDifficulty)
  adjustedTime = Math.min(adjustedTime, settings.maxTimeLimit)

  // NaNチェック
  if (isNaN(adjustedTime) || !isFinite(adjustedTime)) {
    return settings.minTimeLimitByDifficulty || 2.0
  }

  return Math.round(adjustedTime * 10) / 10
}

// Game engine main class
export class GameEngine {
  private db: LocalDBClient
  private display: Display
  private input: InputManager
  private options: CLIOptions

  private state: GameState = {
    isPlaying: false,
    words: [],
    currentIndex: 0,
    currentWord: null,
    totalKeystrokes: 0,
    startTime: null,
    wordResults: [],
  }

  private settings: CLISettings = DEFAULT_SETTINGS
  private gameScores: CLIGameScore[] = []

  private timerInterval: ReturnType<typeof setInterval> | null = null
  private resolveGame: ((result: GameResult) => void) | null = null

  constructor(options: CLIOptions) {
    this.options = options
    this.db = new LocalDBClient()
    this.display = new Display(options.mode)
    this.input = new InputManager()
  }

  /**
   * Start the game
   */
  async start(): Promise<GameResult> {
    // Check DB
    const isDBReady = await this.db.healthCheck()
    if (!isDBReady) {
      this.display.error('Local database not found. Run: bun run db:setup')
      process.exit(1)
    }

    // Load data
    try {
      const [words, settings, scores] = await Promise.all([
        this.db.getWords(),
        this.db.getSettings(),
        this.db.getGameScores(),
      ])

      if (words.length === 0) {
        this.display.error('No words found. Add some words in the web app first.')
        process.exit(1)
      }

      this.settings = settings || DEFAULT_SETTINGS
      this.gameScores = scores

      // Shuffle words
      const shuffled = [...words].sort(() => Math.random() - 0.5)

      // Limit word count
      const count = this.options.count === 'all' ? shuffled.length : this.options.count
      this.state.words = shuffled.slice(0, count)
    } catch (error) {
      this.display.error(`Failed to load data: ${error}`)
      process.exit(1)
    }

    // Prepare display
    this.display.hideCursor()
    this.display.start(this.state.words.length)

    // Start game
    return new Promise(resolve => {
      this.resolveGame = resolve
      this.state.isPlaying = true
      this.state.startTime = Date.now()
      this.state.currentIndex = 0
      this.state.totalKeystrokes = 0
      this.state.wordResults = []

      // Start first word
      this.startWord()

      // Start input monitoring
      this.input.start(this.handleKeypress.bind(this))
    })
  }

  /**
   * Start a word
   */
  private startWord(): void {
    const word = this.state.words[this.state.currentIndex]
    const timeLimit = calculateWordTimeLimit(word, this.gameScores, this.settings)

    this.state.currentWord = {
      word,
      input: '',
      timeRemaining: timeLimit,
      totalTime: timeLimit,
      missCount: 0,
      startTime: Date.now(),
      firstKeyTime: null,
    }

    // Start timer
    this.startTimer()

    // Update display
    this.updateDisplay()
  }

  /**
   * Start timer
   */
  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (!this.state.currentWord) return

      this.state.currentWord.timeRemaining -= 0.1

      if (this.state.currentWord.timeRemaining <= 0) {
        this.handleTimeout()
      } else {
        this.updateDisplay()
      }
    }, 100)
  }

  /**
   * Stop timer
   */
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  /**
   * Handle timeout
   */
  private handleTimeout(): void {
    if (!this.state.currentWord) return

    this.stopTimer()

    const cw = this.state.currentWord
    const result: WordResult = {
      wordId: cw.word.id,
      text: cw.word.text,
      reading: cw.word.reading,
      romaji: cw.word.romaji,
      success: false,
      completed: false,
      missCount: cw.missCount,
      completionTime: Date.now() - cw.startTime,
      reactionTime: cw.firstKeyTime ? cw.firstKeyTime - cw.startTime : 0,
    }
    this.state.wordResults.push(result)

    // Update word stats (timeout is recorded as miss)
    this.db.updateWordStats(cw.word.id, false).catch(() => {})

    // Show completion (no time display)
    this.display.complete(this.getDisplayData(true, false), false)

    // Move to next word
    this.nextWord()
  }

  /**
   * Handle key press
   */
  private handleKeypress(key: string, ctrl: boolean, _meta: boolean): void {
    if (!this.state.isPlaying || !this.state.currentWord) return

    // Exit on Escape
    if (key === 'escape') {
      this.endGame()
      return
    }

    // Backspace
    if (key === 'backspace') {
      this.state.currentWord.input = this.state.currentWord.input.slice(0, -1)
      this.updateDisplay()
      return
    }

    // Suspend on Ctrl+Z
    if (ctrl && key === 'z') {
      this.stopTimer()
      this.display.info('\n[Process suspended. Press any key to continue...]')
      // Resume on next key (simple implementation)
      return
    }

    // Normal key input
    if (key.length === 1 && /[a-zA-Z0-9.\-_?!,;:'"]/.test(key)) {
      this.handleCharInput(key.toLowerCase())
    }
  }

  /**
   * Handle character input
   */
  private handleCharInput(char: string): void {
    const cw = this.state.currentWord!
    const newInput = cw.input + char

    // Record first key time
    if (cw.input.length === 0) {
      cw.firstKeyTime = Date.now()
    }

    // Validate input
    const prevValidation = validateRomajiInput(cw.word.romaji, cw.input)
    const newValidation = validateRomajiInput(cw.word.romaji, newInput)

    this.state.totalKeystrokes++

    // If progress didn't increase, it's a miss
    if (newValidation.progress <= prevValidation.progress && !newValidation.isCorrect) {
      cw.missCount++

      // Miss penalty is disabled (CLI mode doesn't reduce time limit)
      // const penalty = calculateMissPenalty(cw.missCount, cw.timeRemaining, this.settings)
      // cw.timeRemaining = Math.max(0, cw.timeRemaining - penalty)

      // Update word stats (async)
      this.db.updateWordStats(cw.word.id, false).catch(() => {})

      this.updateDisplay(true)
      return
    }

    // Accept input
    cw.input = newInput

    // Check if word is complete
    if (newValidation.isCorrect) {
      this.handleWordComplete()
    } else {
      this.updateDisplay()
    }
  }

  /**
   * Handle word completion
   */
  private handleWordComplete(): void {
    this.stopTimer()

    const cw = this.state.currentWord!
    const success = cw.missCount === 0

    const result: WordResult = {
      wordId: cw.word.id,
      text: cw.word.text,
      reading: cw.word.reading,
      romaji: cw.word.romaji,
      success,
      completed: true,
      missCount: cw.missCount,
      completionTime: Date.now() - cw.startTime,
      reactionTime: cw.firstKeyTime ? cw.firstKeyTime - cw.startTime : 0,
    }
    this.state.wordResults.push(result)

    // Update word stats (async)
    this.db.updateWordStats(cw.word.id, true).catch(() => {})

    // Show completion
    this.display.complete(this.getDisplayData(false, true), success)

    // Move to next word
    this.nextWord()
  }

  /**
   * Move to next word
   */
  private nextWord(): void {
    this.state.currentIndex++

    if (this.state.currentIndex >= this.state.words.length) {
      this.endGame()
    } else {
      this.startWord()
    }
  }

  /**
   * End game
   */
  private endGame(): void {
    this.stopTimer()
    this.input.stop()
    this.state.isPlaying = false

    const endTime = Date.now()
    const totalTime = this.state.startTime ? (endTime - this.state.startTime) / 1000 : 0

    // Calculate results
    const results = this.state.wordResults
    const completedWords = results.filter(r => r.completed).length
    const successfulWords = results.filter(r => r.success).length
    const failedWords = results.length - successfulWords

    const kps = totalTime > 0 ? Math.round((this.state.totalKeystrokes / totalTime) * 10) / 10 : 0
    const accuracy = results.length > 0 ? Math.round((successfulWords / results.length) * 100) : 100

    const gameResult: GameResult = {
      kps,
      totalKeystrokes: this.state.totalKeystrokes,
      accuracy,
      completedWords,
      successfulWords,
      failedWords,
      totalWords: this.state.words.length,
      totalTime,
      wordResults: results,
    }

    // Show results
    this.display.result(gameResult)
    this.display.showCursor()

    // Save score (can be disabled with option)
    if (!this.options.noSave && results.length > 0) {
      this.db
        .saveGameScore({
          kps,
          totalKeystrokes: this.state.totalKeystrokes,
          accuracy,
          completedWords,
          successfulWords,
          totalWords: this.state.words.length,
          totalTime,
        })
        .catch(err => {
          this.display.error(`Failed to save score: ${err}`)
        })
    }

    // Close DB connection
    this.db.close()

    if (this.resolveGame) {
      this.resolveGame(gameResult)
    }
  }

  /**
   * Get display data
   */
  private getDisplayData(isTimeout: boolean = false, isComplete: boolean = false): DisplayData {
    const cw = this.state.currentWord!
    const elapsed = this.state.startTime ? (Date.now() - this.state.startTime) / 1000 : 0
    const kps =
      elapsed > 0 && !isNaN(elapsed)
        ? Math.round((this.state.totalKeystrokes / elapsed) * 10) / 10
        : 0

    const completedCount = this.state.wordResults.filter(r => r.success).length
    const attemptedCount = this.state.wordResults.length
    const accuracy = attemptedCount > 0 ? Math.round((completedCount / attemptedCount) * 100) : 100

    // NaN check
    const timeRemaining =
      isNaN(cw.timeRemaining) || !isFinite(cw.timeRemaining) ? 0 : cw.timeRemaining
    const totalTime = isNaN(cw.totalTime) || !isFinite(cw.totalTime) ? 10 : cw.totalTime

    return {
      text: cw.word.text,
      reading: cw.word.reading,
      romaji: cw.word.romaji,
      input: cw.input,
      currentIndex: this.state.currentIndex,
      totalWords: this.state.words.length,
      timeRemaining,
      totalTime,
      kps,
      accuracy,
      missCount: cw.missCount,
      isError: false,
      isComplete,
      isTimeout,
    }
  }

  /**
   * Update display
   */
  private updateDisplay(isError: boolean = false): void {
    const data = this.getDisplayData()
    data.isError = isError
    this.display.update(data)
  }
}
