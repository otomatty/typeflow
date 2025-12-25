/**
 * CLI Display Module
 * Display processing for each stealth mode
 */

import type { DisplayData, DisplayMode, GameResult } from './types'

// ANSI escape codes for colors and formatting
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const GRAY = '\x1b[90m'

// Hide/show cursor
const HIDE_CURSOR = '\x1b[?25l'
const SHOW_CURSOR = '\x1b[?25h'

// Clear line and move cursor
const CLEAR_LINE = '\x1b[2K'
const CLEAR_SCREEN = '\x1b[2J\x1b[H'

/**
 * Generate progress bar
 */
function progressBar(current: number, total: number, width: number = 10): string {
  const filled = Math.floor((current / total) * width)
  const empty = width - filled
  return `[${'#'.repeat(filled)}${'.'.repeat(empty)}]`
}

/**
 * Format time
 */
function formatTime(seconds: number): string {
  return seconds.toFixed(1) + 's'
}

/**
 * Get current timestamp
 */
function getTimestamp(): string {
  const now = new Date()
  return now.toISOString().replace('T', ' ').substring(0, 19)
}

// ============================================================
// Minimal Mode - Ultra simple display
// ============================================================

function renderMinimal(data: DisplayData): string {
  const progress = progressBar(data.totalTime - data.timeRemaining, data.totalTime)
  const timeStr = formatTime(data.timeRemaining)

  // Display Japanese text (with kanji), show only entered romaji
  const inputPart = data.input || ''

  let line = `${data.text}: ${GREEN}${inputPart}${RESET}█ ${progress} ${timeStr}`

  if (data.isError) {
    line = `${data.text}: ${RED}${inputPart}${RESET}█ ${progress} ${timeStr}`
  }

  return line
}

function renderMinimalComplete(data: DisplayData, success: boolean): string {
  const status = success ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`
  return `${status} ${data.text} → ${data.romaji}`
}

function renderMinimalResult(result: GameResult): string {
  const lines: string[] = [
    '',
    `${BOLD}━━━ Result ━━━${RESET}`,
    `KPS: ${result.kps.toFixed(1)}`,
    `Accuracy: ${result.accuracy}%`,
    `Words: ${result.successfulWords}/${result.totalWords} (${result.completedWords} completed)`,
    `Time: ${result.totalTime.toFixed(1)}s`,
    '',
  ]
  return lines.join('\n')
}

// ============================================================
// Log Mode - Log output style
// ============================================================

function renderLog(data: DisplayData): string {
  const timestamp = getTimestamp()
  const progress = progressBar(data.totalTime - data.timeRemaining, data.totalTime)
  const timeStr = formatTime(data.timeRemaining)

  // Display Japanese text (with kanji), show only entered romaji
  const inputPart = data.input || ''
  const inputDisplay = inputPart ? `${GREEN}${inputPart}${RESET}█` : '█'

  return `${GRAY}[${timestamp}]${RESET} Processing: ${data.text} > ${inputDisplay} ${progress} ${timeStr}`
}

function renderLogComplete(data: DisplayData, success: boolean): string {
  const timestamp = getTimestamp()

  if (success) {
    return `${GRAY}[${timestamp}]${RESET} ${GREEN}OK${RESET}: ${data.text} → ${data.romaji} (0 miss)`
  } else if (data.isTimeout) {
    return `${GRAY}[${timestamp}]${RESET} ${RED}TIMEOUT${RESET}: ${data.text}`
  } else {
    return `${GRAY}[${timestamp}]${RESET} ${YELLOW}WARN${RESET}: ${data.text} → ${data.romaji} (${data.missCount} miss)`
  }
}

function renderLogResult(result: GameResult): string {
  const timestamp = getTimestamp()
  const lines: string[] = [
    '',
    `${GRAY}[${timestamp}]${RESET} ${BOLD}Session complete${RESET}`,
    `${GRAY}[${timestamp}]${RESET} Stats: KPS=${result.kps.toFixed(1)}, ACC=${result.accuracy}%, TIME=${result.totalTime.toFixed(1)}s`,
    `${GRAY}[${timestamp}]${RESET} Words: ${result.successfulWords} passed, ${result.failedWords} failed, ${result.totalWords} total`,
    '',
  ]
  return lines.join('\n')
}

// ============================================================
// Test Mode - Test execution style
// ============================================================

function renderTest(data: DisplayData): string {
  const progress = progressBar(data.totalTime - data.timeRemaining, data.totalTime)
  const timeStr = formatTime(data.timeRemaining)

  // Display Japanese text (with kanji), show only entered romaji
  const inputPart = data.input || ''
  const inputDisplay = inputPart ? `${GREEN}${inputPart}${RESET}█` : '█'

  return `${YELLOW}○${RESET} run:  ${data.text} → ${inputDisplay} ${progress} ${timeStr}`
}

function renderTestComplete(data: DisplayData, success: boolean): string {
  if (success) {
    return `${GREEN}✓${RESET} pass: ${data.text} → ${data.romaji}`
  } else if (data.isTimeout) {
    return `${RED}✗${RESET} fail: ${data.text} (timeout)`
  } else {
    return `${RED}✗${RESET} fail: ${data.text} → ${data.romaji} (${data.missCount} errors)`
  }
}

function renderTestResult(result: GameResult): string {
  const lines: string[] = [
    '',
    `${BOLD}Test Suites:${RESET} 1 total`,
    `${BOLD}Tests:${RESET}       ${GREEN}${result.successfulWords} passed${RESET}, ${RED}${result.failedWords} failed${RESET}, ${result.totalWords} total`,
    `${BOLD}Time:${RESET}        ${result.totalTime.toFixed(2)}s`,
    `${BOLD}KPS:${RESET}         ${result.kps.toFixed(1)}`,
    `${BOLD}Accuracy:${RESET}    ${result.accuracy}%`,
    '',
  ]
  return lines.join('\n')
}

// ============================================================
// Build Mode - Build log style
// ============================================================

function renderBuild(data: DisplayData): string {
  const percent = Math.floor(((data.totalTime - data.timeRemaining) / data.totalTime) * 100)
  const width = 8
  const filled = Math.floor((percent / 100) * width)
  const empty = width - filled
  const bar = `${'█'.repeat(filled)}${'░'.repeat(empty)}`

  // Display Japanese text (with kanji), show only entered romaji
  const inputPart = data.input || ''
  const inputDisplay = inputPart ? `${GREEN}${inputPart}${RESET}█` : '█'

  const lines = [
    `${CYAN}Compiling${RESET} word ${data.currentIndex + 1}/${data.totalWords}: ${data.text}`,
    `  ${DIM}→${RESET} Transpiling: [${bar}] ${percent}%`,
    `  ${DIM}→${RESET} Input: ${inputDisplay}`,
    `  ${DIM}→${RESET} Elapsed: ${formatTime(data.totalTime - data.timeRemaining)} / ${formatTime(data.totalTime)}`,
  ]

  return lines.join('\n')
}

function renderBuildComplete(data: DisplayData, success: boolean): string {
  if (success) {
    return `${GREEN}✓${RESET} Compiled ${data.text} → ${data.romaji}`
  } else if (data.isTimeout) {
    return `${RED}✗${RESET} Timeout compiling ${data.text}`
  } else {
    return `${YELLOW}⚠${RESET} Compiled ${data.text} with ${data.missCount} warnings`
  }
}

function renderBuildResult(result: GameResult): string {
  const status =
    result.failedWords === 0
      ? `${GREEN}BUILD SUCCESSFUL${RESET}`
      : `${YELLOW}BUILD COMPLETED WITH WARNINGS${RESET}`

  const lines: string[] = [
    '',
    `${BOLD}${status}${RESET}`,
    '',
    `  Compiled: ${result.successfulWords}/${result.totalWords} modules`,
    `  Warnings: ${result.failedWords}`,
    `  Time:     ${result.totalTime.toFixed(2)}s`,
    `  Speed:    ${result.kps.toFixed(1)} kps`,
    '',
  ]
  return lines.join('\n')
}

// ============================================================
// Git Mode - Git operation style
// ============================================================

function renderGit(data: DisplayData): string {
  const progress = progressBar(data.totalTime - data.timeRemaining, data.totalTime)
  const timeStr = formatTime(data.timeRemaining)

  // Display Japanese text (with kanji), show only entered romaji
  const inputPart = data.input || ''
  const inputDisplay = inputPart ? `${GREEN}${inputPart}${RESET}█` : '█'

  const lines = [
    `$ ${CYAN}git commit -m "${data.text}"${RESET}`,
    `${DIM}hint: Waiting for message...${RESET}`,
    `> ${inputDisplay}`,
    `${progress} ${timeStr} remaining`,
  ]

  return lines.join('\n')
}

function renderGitComplete(data: DisplayData, success: boolean): string {
  if (success) {
    const hash = Math.random().toString(16).substring(2, 9)
    return `[main ${YELLOW}${hash}${RESET}] ${data.text} → ${data.romaji}\n 1 file changed`
  } else if (data.isTimeout) {
    return `${RED}error:${RESET} commit aborted: timeout (${data.text})`
  } else {
    return `${YELLOW}warning:${RESET} commit ${data.text} completed with ${data.missCount} fixups`
  }
}

function renderGitResult(result: GameResult): string {
  const lines: string[] = [
    '',
    `${BOLD}Commits: ${result.successfulWords} clean, ${result.failedWords} with fixups${RESET}`,
    `Total time: ${result.totalTime.toFixed(2)}s`,
    `Average speed: ${result.kps.toFixed(1)} kps`,
    `Accuracy: ${result.accuracy}%`,
    '',
  ]
  return lines.join('\n')
}

// ============================================================
// Display Manager
// ============================================================

export class Display {
  private mode: DisplayMode
  private lastLineCount: number = 0

  constructor(mode: DisplayMode) {
    this.mode = mode
  }

  /**
   * Hide cursor
   */
  hideCursor(): void {
    process.stdout.write(HIDE_CURSOR)
  }

  /**
   * Show cursor
   */
  showCursor(): void {
    process.stdout.write(SHOW_CURSOR)
  }

  /**
   * Clear screen
   */
  clear(): void {
    process.stdout.write(CLEAR_SCREEN)
  }

  /**
   * Clear previous output and display new content
   */
  update(data: DisplayData): void {
    // Move up and clear previous lines
    if (this.lastLineCount > 0) {
      process.stdout.write(`\x1b[${this.lastLineCount}A`)
      for (let i = 0; i < this.lastLineCount; i++) {
        process.stdout.write(CLEAR_LINE + '\n')
      }
      process.stdout.write(`\x1b[${this.lastLineCount}A`)
    }

    let output: string
    switch (this.mode) {
      case 'minimal':
        output = renderMinimal(data)
        break
      case 'log':
        output = renderLog(data)
        break
      case 'test':
        output = renderTest(data)
        break
      case 'build':
        output = renderBuild(data)
        break
      case 'git':
        output = renderGit(data)
        break
      default:
        output = renderMinimal(data)
    }

    const lines = output.split('\n')
    this.lastLineCount = lines.length
    console.log(output)
  }

  /**
   * Display when word is completed
   */
  complete(data: DisplayData, success: boolean): void {
    // Clear previous output
    if (this.lastLineCount > 0) {
      process.stdout.write(`\x1b[${this.lastLineCount}A`)
      for (let i = 0; i < this.lastLineCount; i++) {
        process.stdout.write(CLEAR_LINE + '\n')
      }
      process.stdout.write(`\x1b[${this.lastLineCount}A`)
    }

    let output: string
    switch (this.mode) {
      case 'minimal':
        output = renderMinimalComplete(data, success)
        break
      case 'log':
        output = renderLogComplete(data, success)
        break
      case 'test':
        output = renderTestComplete(data, success)
        break
      case 'build':
        output = renderBuildComplete(data, success)
        break
      case 'git':
        output = renderGitComplete(data, success)
        break
      default:
        output = renderMinimalComplete(data, success)
    }

    this.lastLineCount = 0
    console.log(output)
  }

  /**
   * Display game results
   */
  result(result: GameResult): void {
    let output: string
    switch (this.mode) {
      case 'minimal':
        output = renderMinimalResult(result)
        break
      case 'log':
        output = renderLogResult(result)
        break
      case 'test':
        output = renderTestResult(result)
        break
      case 'build':
        output = renderBuildResult(result)
        break
      case 'git':
        output = renderGitResult(result)
        break
      default:
        output = renderMinimalResult(result)
    }

    console.log(output)
  }

  /**
   * Start message
   */
  start(totalWords: number): void {
    switch (this.mode) {
      case 'minimal':
        console.log(`\n${BOLD}Starting practice (${totalWords} words)${RESET}\n`)
        break
      case 'log':
        console.log(
          `${GRAY}[${getTimestamp()}]${RESET} ${BOLD}Starting session${RESET} (${totalWords} words)`
        )
        break
      case 'test':
        console.log(`\n${BOLD}RUNS${RESET} typing-practice\n`)
        break
      case 'build':
        console.log(`\n${CYAN}Building${RESET} ${totalWords} modules...\n`)
        break
      case 'git':
        console.log(`\n$ ${CYAN}git log --oneline${RESET}\n`)
        break
    }
  }

  /**
   * Error message
   */
  error(message: string): void {
    console.error(`${RED}Error:${RESET} ${message}`)
  }

  /**
   * Info message
   */
  info(message: string): void {
    console.log(`${DIM}${message}${RESET}`)
  }
}
