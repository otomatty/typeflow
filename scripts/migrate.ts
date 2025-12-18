#!/usr/bin/env bun
/**
 * Tursoデータベースマイグレーションスクリプト
 *
 * 使用方法:
 *   bun run scripts/migrate.ts              # リモートTursoデータベースに適用
 *   bun run scripts/migrate.ts --local      # ローカルSQLiteファイルに適用
 */

import { createClient } from '@libsql/client'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

// マイグレーションファイルのディレクトリ
const MIGRATIONS_DIR = join(process.cwd(), 'migrations')

// Tursoクライアントの作成
function createClientFromEnv(local: boolean = false) {
  if (local) {
    // ローカルDBの場合、環境変数から取得、なければデフォルトパスを使用
    let localPath = process.env.TURSO_LOCAL_DB_PATH || process.env.TURSO_DATABASE_URL

    // file: スキームが含まれている場合は除去
    if (localPath?.startsWith('file:')) {
      localPath = localPath.replace(/^file:/, '')
    }

    // 環境変数が設定されていない場合はデフォルトパスを使用
    if (!localPath) {
      localPath = './local.db'
    }

    return createClient({
      url: `file:${localPath}`,
    })
  }

  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    throw new Error('TURSO_DATABASE_URL environment variable is required')
  }

  // ローカルファイルの場合は認証トークン不要
  if (url.startsWith('file:')) {
    return createClient({
      url,
    })
  }

  if (!authToken) {
    throw new Error('TURSO_AUTH_TOKEN environment variable is required for remote database')
  }

  return createClient({
    url,
    authToken,
  })
}

// マイグレーションファイルを読み込む
async function loadMigrations(): Promise<Array<{ name: string; sql: string }>> {
  const files = await readdir(MIGRATIONS_DIR)
  const sqlFiles = files.filter(f => f.endsWith('.sql')).sort() // ファイル名でソート（0001, 0002...の順）

  const migrations: Array<{ name: string; sql: string }> = []
  for (const file of sqlFiles) {
    const path = join(MIGRATIONS_DIR, file)
    const sql = await readFile(path, 'utf-8')
    migrations.push({ name: file, sql })
  }

  return migrations
}

// マイグレーション履歴テーブルを作成
async function ensureMigrationsTable(db: ReturnType<typeof createClient>) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL
    )
  `)
}

// 適用済みマイグレーションを取得
async function getAppliedMigrations(db: ReturnType<typeof createClient>): Promise<string[]> {
  try {
    const result = await db.execute('SELECT name FROM migrations ORDER BY id')
    return result.rows.map(row => row.name as string)
  } catch {
    // テーブルが存在しない場合は空配列を返す
    return []
  }
}

// マイグレーションを適用
async function applyMigration(db: ReturnType<typeof createClient>, name: string, sql: string) {
  console.log(`Applying migration: ${name}`)

  // トランザクション内で実行
  await db.execute('BEGIN')
  try {
    // SQLを実行（複数のステートメントが含まれる場合がある）
    // コメント行を削除してから分割
    const cleanedSql = sql
      .split('\n')
      .map(line => {
        // 行内コメントを削除
        const commentIndex = line.indexOf('--')
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex).trim()
        }
        return line.trim()
      })
      .filter(line => line.length > 0)
      .join('\n')

    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const statement of statements) {
      if (statement) {
        await db.execute(statement)
      }
    }

    // マイグレーション履歴に記録
    await db.execute({
      sql: 'INSERT INTO migrations (name, applied_at) VALUES (?, ?)',
      args: [name, Date.now()],
    })

    await db.execute('COMMIT')
    console.log(`✅ Migration ${name} applied successfully`)
  } catch (error) {
    await db.execute('ROLLBACK')
    console.error(`❌ Failed to apply migration ${name}:`, error)
    throw error
  }
}

// メイン処理
async function main() {
  const isLocal = process.argv.includes('--local')

  console.log(`📊 ${isLocal ? 'Local' : 'Remote'} database migration`)
  console.log('─'.repeat(50))

  try {
    const db = createClientFromEnv(isLocal)
    const migrations = await loadMigrations()

    if (migrations.length === 0) {
      console.log('No migration files found')
      return
    }

    console.log(`Found ${migrations.length} migration(s)`)

    // マイグレーション履歴テーブルを確保
    await ensureMigrationsTable(db)

    // 適用済みマイグレーションを取得
    const applied = await getAppliedMigrations(db)
    console.log(`Already applied: ${applied.length} migration(s)`)

    // 未適用のマイグレーションを適用
    const toApply = migrations.filter(m => !applied.includes(m.name))

    if (toApply.length === 0) {
      console.log('✅ All migrations are already applied')
      return
    }

    console.log(`Applying ${toApply.length} new migration(s)...\n`)

    for (const migration of toApply) {
      await applyMigration(db, migration.name, migration.sql)
    }

    console.log('\n✅ All migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()
