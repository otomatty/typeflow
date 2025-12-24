/**
 * CLI Display Module
 * 各偽装モードの表示処理
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
 * 進捗バーを生成
 */
function progressBar(current: number, total: number, width: number = 10): string {
  const filled = Math.floor((current / total) * width)
  const empty = width - filled
  return `[${'#'.repeat(filled)}${'.'.repeat(empty)}]`
}

/**
 * 時間を整形
 */
function formatTime(seconds: number): string {
  return seconds.toFixed(1) + 's'
}

/**
 * 現在時刻を取得
 */
function getTimestamp(): string {
  const now = new Date()
  return now.toISOString().replace('T', ' ').substring(0, 19)
}

// ============================================================
// Minimal Mode - 超シンプル表示
// ============================================================

function renderMinimal(data: DisplayData): string {
  const progress = progressBar(data.totalTime - data.timeRemaining, data.totalTime)
  const timeStr = formatTime(data.timeRemaining)

  // 日本語（ふりがな）を表示、入力されたローマ字のみ表示
  const inputPart = data.input || ''

  let line = `${data.reading}: ${GREEN}${inputPart}${RESET}█ ${progress} ${timeStr}`

  if (data.isError) {
    line = `${data.reading}: ${RED}${inputPart}${RESET}█ ${progress} ${timeStr}`
  }

  return line
}

function renderMinimalComplete(data: DisplayData, success: boolean): string {
  const status = success ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`
  return `${status} ${data.reading} → ${data.romaji} (${formatTime(data.totalTime - data.timeRemaining)})`
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
// Log Mode - ログ出力風
// ============================================================

function renderLog(data: DisplayData): string {
  const timestamp = getTimestamp()
  const progress = progressBar(data.totalTime - data.timeRemaining, data.totalTime)
  const timeStr = formatTime(data.timeRemaining)

  // 日本語を表示、入力されたローマ字のみ表示
  const inputPart = data.input || ''
  const inputDisplay = inputPart ? `${GREEN}${inputPart}${RESET}█` : '█'

  return `${GRAY}[${timestamp}]${RESET} Processing: ${data.reading} > ${inputDisplay} ${progress} ${timeStr}`
}

function renderLogComplete(data: DisplayData, success: boolean): string {
  const timestamp = getTimestamp()
  const time = formatTime(data.totalTime - data.timeRemaining)

  if (success) {
    return `${GRAY}[${timestamp}]${RESET} ${GREEN}OK${RESET}: ${data.reading} → ${data.romaji} (${time}, 0 miss)`
  } else if (data.isTimeout) {
    return `${GRAY}[${timestamp}]${RESET} ${RED}TIMEOUT${RESET}: ${data.reading}`
  } else {
    return `${GRAY}[${timestamp}]${RESET} ${YELLOW}WARN${RESET}: ${data.reading} → ${data.romaji} (${time}, ${data.missCount} miss)`
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
// Test Mode - テスト実行風
// ============================================================

function renderTest(data: DisplayData): string {
  const progress = progressBar(data.totalTime - data.timeRemaining, data.totalTime)
  const timeStr = formatTime(data.timeRemaining)

  // 日本語を表示、入力されたローマ字のみ表示
  const inputPart = data.input || ''
  const inputDisplay = inputPart ? `${GREEN}${inputPart}${RESET}█` : '█'

  return `${YELLOW}○${RESET} run:  ${data.reading} → ${inputDisplay} ${progress} ${timeStr}`
}

function renderTestComplete(data: DisplayData, success: boolean): string {
  const time = formatTime(data.totalTime - data.timeRemaining)

  if (success) {
    return `${GREEN}✓${RESET} pass: ${data.reading} → ${data.romaji} (${time})`
  } else if (data.isTimeout) {
    return `${RED}✗${RESET} fail: ${data.reading} → ${data.input}... (timeout ${formatTime(data.totalTime)})`
  } else {
    return `${RED}✗${RESET} fail: ${data.reading} → ${data.romaji} (${time}, ${data.missCount} errors)`
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
// Build Mode - ビルドログ風
// ============================================================

function renderBuild(data: DisplayData): string {
  const percent = Math.floor(((data.totalTime - data.timeRemaining) / data.totalTime) * 100)
  const width = 8
  const filled = Math.floor((percent / 100) * width)
  const empty = width - filled
  const bar = `${'█'.repeat(filled)}${'░'.repeat(empty)}`

  // 日本語を表示、入力されたローマ字のみ表示
  const inputPart = data.input || ''
  const inputDisplay = inputPart ? `${GREEN}${inputPart}${RESET}█` : '█'

  const lines = [
    `${CYAN}Compiling${RESET} word ${data.currentIndex + 1}/${data.totalWords}: ${data.reading}`,
    `  ${DIM}→${RESET} Transpiling: [${bar}] ${percent}%`,
    `  ${DIM}→${RESET} Input: ${inputDisplay}`,
    `  ${DIM}→${RESET} Elapsed: ${formatTime(data.totalTime - data.timeRemaining)} / ${formatTime(data.totalTime)}`,
  ]

  return lines.join('\n')
}

function renderBuildComplete(data: DisplayData, success: boolean): string {
  const time = formatTime(data.totalTime - data.timeRemaining)

  if (success) {
    return `${GREEN}✓${RESET} Compiled ${data.reading} → ${data.romaji} (${time})`
  } else if (data.isTimeout) {
    return `${RED}✗${RESET} Timeout compiling ${data.reading} (exceeded ${formatTime(data.totalTime)})`
  } else {
    return `${YELLOW}⚠${RESET} Compiled ${data.reading} with ${data.missCount} warnings (${time})`
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
// Git Mode - git操作風
// ============================================================

function renderGit(data: DisplayData): string {
  const progress = progressBar(data.totalTime - data.timeRemaining, data.totalTime)
  const timeStr = formatTime(data.timeRemaining)

  // 日本語を表示、入力されたローマ字のみ表示
  const inputPart = data.input || ''
  const inputDisplay = inputPart ? `${GREEN}${inputPart}${RESET}█` : '█'

  const lines = [
    `$ ${CYAN}git commit -m "${data.reading}"${RESET}`,
    `${DIM}hint: Waiting for message...${RESET}`,
    `> ${inputDisplay}`,
    `${progress} ${timeStr} remaining`,
  ]

  return lines.join('\n')
}

function renderGitComplete(data: DisplayData, success: boolean): string {
  const time = formatTime(data.totalTime - data.timeRemaining)

  if (success) {
    const hash = Math.random().toString(16).substring(2, 9)
    return `[main ${YELLOW}${hash}${RESET}] ${data.reading} → ${data.romaji}\n 1 file changed (${time})`
  } else if (data.isTimeout) {
    return `${RED}error:${RESET} commit aborted: timeout (${data.reading})`
  } else {
    return `${YELLOW}warning:${RESET} commit ${data.reading} completed with ${data.missCount} fixups`
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
   * カーソルを非表示
   */
  hideCursor(): void {
    process.stdout.write(HIDE_CURSOR)
  }

  /**
   * カーソルを表示
   */
  showCursor(): void {
    process.stdout.write(SHOW_CURSOR)
  }

  /**
   * 画面をクリア
   */
  clear(): void {
    process.stdout.write(CLEAR_SCREEN)
  }

  /**
   * 前回の出力をクリアして新しい内容を表示
   */
  update(data: DisplayData): void {
    // 前回の行数分だけ上に移動してクリア
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
   * 単語完了時の表示
   */
  complete(data: DisplayData, success: boolean): void {
    // 前回の出力をクリア
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
   * ゲーム結果の表示
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
   * 開始メッセージ
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
   * エラーメッセージ
   */
  error(message: string): void {
    console.error(`${RED}Error:${RESET} ${message}`)
  }

  /**
   * 情報メッセージ
   */
  info(message: string): void {
    console.log(`${DIM}${message}${RESET}`)
  }
}
