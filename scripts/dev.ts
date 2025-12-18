#!/usr/bin/env bun
/**
 * ローカル開発環境の一括起動スクリプト
 *
 * フロントエンド（Vite）とバックエンド（Hono API）を並列で起動します。
 *
 * 使用方法:
 *   bun run dev:all
 *
 * または直接実行:
 *   bun run scripts/dev.ts
 */

import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

const PROJECT_ROOT = process.cwd()
const ENV_FILE = join(PROJECT_ROOT, '.env')

// 色付きログ出力
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(prefix: string, color: string, message: string) {
  const timestamp = new Date().toLocaleTimeString()
  console.log(`${color}${prefix}${colors.reset} [${timestamp}] ${message}`)
}

// プロセス管理
const processes: Array<{ name: string; process: ReturnType<typeof spawn> }> = []

function cleanup() {
  console.log('\n')
  log('🛑', colors.yellow, 'Shutting down all processes...')

  processes.forEach(({ name, process }) => {
    try {
      process.kill('SIGTERM')
      log('✅', colors.green, `${name} stopped`)
    } catch (error) {
      log('❌', colors.red, `Failed to stop ${name}: ${error}`)
    }
  })

  process.exit(0)
}

// シグナルハンドラー
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

// 環境変数の確認
if (!existsSync(ENV_FILE)) {
  log('⚠️', colors.yellow, '.env file not found. Running setup...')
  try {
    const { execSync } = await import('child_process')
    execSync('bun run db:setup', { stdio: 'inherit', cwd: PROJECT_ROOT })
    log('✅', colors.green, 'Database setup completed')
  } catch {
    log('❌', colors.red, 'Database setup failed. Please run: bun run db:setup')
    process.exit(1)
  }
}

// フロントエンド（Vite）の起動
function startFrontend() {
  log('🚀', colors.cyan, 'Starting frontend (Vite + React)...')

  const frontend = spawn('bun', ['run', 'dev'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      FORCE_COLOR: '1',
    },
  })

  frontend.on('error', error => {
    log('❌', colors.red, `Frontend error: ${error.message}`)
  })

  frontend.on('exit', code => {
    if (code !== 0 && code !== null) {
      log('❌', colors.red, `Frontend exited with code ${code}`)
    }
  })

  processes.push({ name: 'Frontend (Vite)', process: frontend })
  return frontend
}

// バックエンド（Hono API）の起動
function startBackend() {
  log('🚀', colors.magenta, 'Starting backend (Hono API + Turso)...')

  const backend = spawn('bun', ['run', 'server:dev'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      FORCE_COLOR: '1',
    },
  })

  backend.on('error', error => {
    log('❌', colors.red, `Backend error: ${error.message}`)
  })

  backend.on('exit', code => {
    if (code !== 0 && code !== null) {
      log('❌', colors.red, `Backend exited with code ${code}`)
    }
  })

  processes.push({ name: 'Backend (API)', process: backend })
  return backend
}

// メイン処理
async function main() {
  console.log('\n' + '='.repeat(60))
  log('🎯', colors.bright, 'TypeFlow Development Environment')
  console.log('='.repeat(60))
  console.log('')
  log('📋', colors.blue, 'Tech Stack:')
  console.log('   • Frontend: React 19 + Vite')
  console.log('   • Backend:  Hono + Bun')
  console.log('   • Database: Turso (libSQL/SQLite)')
  console.log('')
  log('🌐', colors.blue, 'URLs:')
  console.log('   • Frontend: http://localhost:5173')
  console.log('   • Backend:  http://localhost:3456')
  console.log('')
  console.log('─'.repeat(60))
  console.log('')

  // プロセス起動
  startFrontend()

  // バックエンドは少し遅延させて起動（フロントエンドの初期化を待つ）
  setTimeout(() => {
    startBackend()
  }, 1000)

  console.log('')
  log('✅', colors.green, 'All services started!')
  log('💡', colors.yellow, 'Press Ctrl+C to stop all services')
  console.log('')
}

main().catch(error => {
  log('❌', colors.red, `Failed to start: ${error.message}`)
  cleanup()
})
