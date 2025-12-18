#!/usr/bin/env bun
/**
 * ローカルデータベースの初期セットアップスクリプト
 *
 * このスクリプトは以下を実行します：
 * 1. .envファイルが存在しない場合、.env.exampleから作成
 * 2. ローカルデータベースにマイグレーションを適用
 *
 * 使用方法:
 *   bun run scripts/setup-local-db.ts
 */

import { existsSync, copyFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const ENV_FILE = join(process.cwd(), '.env')
const ENV_EXAMPLE_FILE = join(process.cwd(), '.env.example')

async function setupEnvFile() {
  if (existsSync(ENV_FILE)) {
    console.log('✅ .env file already exists')
    return
  }

  if (!existsSync(ENV_EXAMPLE_FILE)) {
    console.error('❌ .env.example file not found')
    process.exit(1)
  }

  console.log('📝 Creating .env file from .env.example...')
  copyFileSync(ENV_EXAMPLE_FILE, ENV_FILE)
  console.log('✅ .env file created')
}

async function runMigrations() {
  console.log('\n📊 Running database migrations...')
  try {
    execSync('bun run db:migrate:local', { stdio: 'inherit' })
    console.log('✅ Migrations completed')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

async function main() {
  console.log('🚀 Setting up local database...')
  console.log('─'.repeat(50))

  try {
    await setupEnvFile()
    await runMigrations()

    console.log('\n✅ Local database setup completed!')
    console.log('\n📝 Next steps:')
    console.log('   1. Review .env file if needed')
    console.log('   2. Start the server: bun run server:dev')
    console.log('   3. The API will be available at http://localhost:3456')
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

main()
