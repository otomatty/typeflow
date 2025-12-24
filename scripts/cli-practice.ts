#!/usr/bin/env bun
/**
 * CLI Typing Practice
 * ターミナルで目立たずにタイピング練習
 *
 * Usage:
 *   bun run cli:practice                    # 基本実行
 *   bun run cli:practice --mode=log         # ログ風表示
 *   bun run cli:practice --mode=test        # テスト風表示
 *   bun run cli:practice --mode=build       # ビルド風表示
 *   bun run cli:practice --mode=git         # git風表示
 *   bun run cli:practice --count=10         # 10単語のみ
 *   bun run cli:practice --no-save          # スコア保存しない
 *   bun run cli:practice --help             # ヘルプ表示
 */

import { parseArgs } from 'util'
import { GameEngine } from './cli/game-engine'
import type { CLIOptions, DisplayMode } from './cli/types'

const HELP_TEXT = `
🥷 TypeFlow CLI Practice - 目立たずにタイピング練習

Usage:
  bun run cli:practice [options]

Options:
  --mode=<mode>       Display mode (default: minimal)
                      minimal - シンプルな表示
                      log     - ログ出力風
                      test    - テスト実行風
                      build   - ビルドログ風
                      git     - git操作風

  --count=<n>         Number of words (default: 20, 'all' for all words)
  --difficulty=<d>    Difficulty preset (easy|normal|hard|expert)
  --quiet             Show results only
  --no-save           Don't save score to database
  --help              Show this help message

Examples:
  bun run cli:practice                      # 基本練習
  bun run cli:practice --mode=log           # ログ風に偽装
  bun run cli:practice --mode=test          # テスト実行風に偽装
  bun run cli:practice --count=10           # 10問だけ練習
  bun run cli:practice --mode=build --count=all  # 全問ビルド風

Controls:
  Type the romaji to complete each word
  Backspace - Delete last character
  Escape    - Quit immediately (score saved)
  Ctrl+C    - Force quit (score not saved)

Data:
  Uses local.db directly (same data as the web app)
  No server required - works offline!

Tips for stealth practice:
  - Use --mode=log or --mode=test to blend in with terminal output
  - Keep the terminal small and in a corner
  - Practice during compilation waits 😉
`

function parseCliArgs(): CLIOptions {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      mode: { type: 'string', default: 'minimal' },
      count: { type: 'string', default: '20' },
      difficulty: { type: 'string', default: 'normal' },
      quiet: { type: 'boolean', default: false },
      'no-save': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  })

  if (values.help) {
    console.log(HELP_TEXT)
    process.exit(0)
  }

  // モードの検証
  const validModes: DisplayMode[] = ['minimal', 'log', 'test', 'build', 'git']
  const mode = values.mode as string
  if (!validModes.includes(mode as DisplayMode)) {
    console.error(`Invalid mode: ${mode}. Valid modes: ${validModes.join(', ')}`)
    process.exit(1)
  }

  // 単語数の解析
  const countStr = values.count as string
  const count = countStr === 'all' ? 'all' : parseInt(countStr, 10)
  if (count !== 'all' && (isNaN(count) || count < 1)) {
    console.error(`Invalid count: ${countStr}. Must be a positive number or 'all'.`)
    process.exit(1)
  }

  // 難易度の検証
  const validDifficulties = ['easy', 'normal', 'hard', 'expert']
  const difficulty = values.difficulty as string
  if (!validDifficulties.includes(difficulty)) {
    console.error(
      `Invalid difficulty: ${difficulty}. Valid difficulties: ${validDifficulties.join(', ')}`
    )
    process.exit(1)
  }

  return {
    mode: mode as DisplayMode,
    count,
    difficulty: difficulty as 'easy' | 'normal' | 'hard' | 'expert',
    quiet: values.quiet as boolean,
    noSave: values['no-save'] as boolean,
  }
}

async function main() {
  const options = parseCliArgs()

  // Graceful exit handling
  process.on('SIGINT', () => {
    console.log('\n\x1b[?25h') // Show cursor
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\n\x1b[?25h') // Show cursor
    process.exit(0)
  })

  try {
    const engine = new GameEngine(options)
    await engine.start()
  } catch (error) {
    console.error('\x1b[?25h') // Show cursor
    console.error(`\x1b[31mError:\x1b[0m ${error}`)
    process.exit(1)
  }
}

main()
