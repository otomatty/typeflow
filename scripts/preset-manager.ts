#!/usr/bin/env bun
/**
 * プリセットデータ管理スクリプト
 *
 * 使用方法:
 *   # romajiに問題がある単語を検索
 *   bun run scripts/preset-manager.ts find [--local]
 *
 *   # 「を」の問題を一括修正
 *   bun run scripts/preset-manager.ts fix [--local] [--dry-run]
 *
 *   # プリセットデータをJSONにエクスポート
 *   bun run scripts/preset-manager.ts export [--local]
 *
 *   # JSONからプリセットデータをインポート
 *   bun run scripts/preset-manager.ts import [--local]
 */

import { createClient, type Client } from '@libsql/client'
import * as wanakana from 'wanakana'
import { mkdir, writeFile, readFile, readdir } from 'fs/promises'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data', 'presets')

// Tursoクライアントの作成
function createDb(local: boolean): Client {
  if (local) {
    const path = (process.env.TURSO_LOCAL_DB_PATH || './local.db').replace(/^file:/, '')
    return createClient({ url: `file:${path}` })
  }

  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) throw new Error('TURSO_DATABASE_URL is required')
  if (url.startsWith('file:')) return createClient({ url })
  if (!authToken) throw new Error('TURSO_AUTH_TOKEN is required for remote database')

  return createClient({ url, authToken })
}

// romajiの問題を検索・修正
async function processRomajiIssues(db: Client, fix: boolean, dryRun: boolean) {
  const tables = ['words', 'preset_words', 'user_preset_words']
  let totalIssues = 0

  console.log(
    fix
      ? `\n🔧 ${dryRun ? '[DRY RUN] ' : ''}Fixing romaji issues...`
      : '\n🔍 Finding romaji issues...'
  )
  console.log('─'.repeat(60))

  for (const table of tables) {
    try {
      const result = await db.execute(
        `SELECT id, text, reading, romaji FROM ${table} WHERE reading LIKE '%を%'`
      )

      for (const row of result.rows) {
        const reading = row.reading as string
        const romaji = row.romaji as string
        const woCount = (reading.match(/を/g) || []).length
        const woInRomaji = (romaji.match(/wo/gi) || []).length

        if (woCount !== woInRomaji) {
          totalIssues++
          const correctRomaji = generateCorrectRomaji(reading, romaji)

          console.log(`\n[${table}] ID ${row.id}: ${row.text}`)
          console.log(`  Reading: ${reading}`)
          console.log(`  Before:  ${romaji}`)
          console.log(`  After:   ${correctRomaji}`)

          if (fix && !dryRun) {
            await db.execute({
              sql: `UPDATE ${table} SET romaji = ? WHERE id = ?`,
              args: [correctRomaji, row.id],
            })
          }
        }
      }
    } catch {
      // テーブルが存在しない場合はスキップ
    }
  }

  if (totalIssues === 0) {
    console.log('\n✅ No issues found!')
  } else if (fix) {
    console.log(`\n${dryRun ? '🔍 Would fix' : '✅ Fixed'} ${totalIssues} issue(s)`)
  } else {
    console.log(`\n⚠️  Found ${totalIssues} issue(s). Run 'fix' to repair.`)
  }
}

// 正しいromajiを生成（訓令式/ヘボン式を維持）
function generateCorrectRomaji(reading: string, currentRomaji: string): string {
  const hepburn = wanakana.toRomaji(reading)

  // 現在のromajiが訓令式かどうか判定
  const isKunrei = /si|ti|tu|hu/.test(currentRomaji)
  if (!isKunrei) return hepburn

  // 訓令式に変換
  return hepburn
    .replace(/shi/g, 'si')
    .replace(/chi/g, 'ti')
    .replace(/tsu/g, 'tu')
    .replace(/fu/g, 'hu')
    .replace(/sha/g, 'sya')
    .replace(/shu/g, 'syu')
    .replace(/sho/g, 'syo')
    .replace(/cha/g, 'tya')
    .replace(/chu/g, 'tyu')
    .replace(/cho/g, 'tyo')
    .replace(/ja/g, 'zya')
    .replace(/ji/g, 'zi')
    .replace(/ju/g, 'zyu')
    .replace(/jo/g, 'zyo')
}

// プリセットデータをエクスポート
async function exportPresets(db: Client) {
  console.log('\n📤 Exporting presets to JSON...')
  console.log('─'.repeat(60))

  // data/presetsディレクトリを作成
  await mkdir(DATA_DIR, { recursive: true })

  // プリセット一覧を取得
  const presetsResult = await db.execute('SELECT * FROM presets ORDER BY name')

  if (presetsResult.rows.length === 0) {
    console.log('No presets found.')
    return
  }

  console.log(`Found ${presetsResult.rows.length} presets`)

  for (const preset of presetsResult.rows) {
    const presetId = preset.id as string

    // プリセットの単語を取得
    const wordsResult = await db.execute({
      sql: 'SELECT text, reading, romaji FROM preset_words WHERE preset_id = ? ORDER BY word_order',
      args: [presetId],
    })

    const data = {
      id: presetId,
      name: preset.name,
      description: preset.description,
      difficulty: preset.difficulty,
      words: wordsResult.rows.map(w => ({
        text: w.text,
        reading: w.reading,
        romaji: w.romaji,
      })),
    }

    const filePath = join(DATA_DIR, `${presetId}.json`)
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`  ✅ ${presetId}.json (${wordsResult.rows.length} words)`)
  }

  console.log(`\n✅ Exported to ${DATA_DIR}/`)
}

// JSONからプリセットデータをインポート
async function importPresets(db: Client, dryRun: boolean) {
  console.log(`\n📥 ${dryRun ? '[DRY RUN] ' : ''}Importing presets from JSON...`)
  console.log('─'.repeat(60))

  let files: string[]
  try {
    files = await readdir(DATA_DIR)
  } catch {
    console.error(`❌ Directory not found: ${DATA_DIR}`)
    console.log('Run "export" first to create preset JSON files.')
    return
  }

  const jsonFiles = files.filter(f => f.endsWith('.json'))
  if (jsonFiles.length === 0) {
    console.log('No JSON files found.')
    return
  }

  console.log(`Found ${jsonFiles.length} JSON files`)

  for (const file of jsonFiles) {
    const filePath = join(DATA_DIR, file)
    const content = await readFile(filePath, 'utf-8')
    const data = JSON.parse(content) as {
      id: string
      name: string
      description: string
      difficulty: string
      words: Array<{ text: string; reading: string; romaji: string }>
    }

    console.log(`\n  📦 ${data.id}: ${data.name} (${data.words.length} words)`)

    if (!dryRun) {
      // 既存のプリセットを削除
      await db.execute({ sql: 'DELETE FROM preset_words WHERE preset_id = ?', args: [data.id] })
      await db.execute({ sql: 'DELETE FROM presets WHERE id = ?', args: [data.id] })

      // プリセットを挿入
      const now = Date.now()
      await db.execute({
        sql: `INSERT INTO presets (id, name, description, difficulty, word_count, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [data.id, data.name, data.description, data.difficulty, data.words.length, now, now],
      })

      // 単語を挿入
      for (let i = 0; i < data.words.length; i++) {
        const word = data.words[i]
        await db.execute({
          sql: `INSERT INTO preset_words (preset_id, text, reading, romaji, word_order, created_at)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [data.id, word.text, word.reading, word.romaji, i, now],
        })
      }
    }
  }

  console.log(`\n${dryRun ? '🔍 Would import' : '✅ Imported'} ${jsonFiles.length} preset(s)`)
}

// メイン
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const isLocal = args.includes('--local')
  const isDryRun = args.includes('--dry-run')

  if (!command || !['find', 'fix', 'export', 'import'].includes(command)) {
    console.log(`
📦 Preset Manager - プリセットデータ管理ツール

使用方法:
  bun run scripts/preset-manager.ts <command> [options]

コマンド:
  find      romajiに問題がある単語を検索
  fix       「を」の問題を一括修正
  export    プリセットデータをJSONにエクスポート
  import    JSONからプリセットデータをインポート

オプション:
  --local     ローカルDBを使用（デフォルトはTursoクラウド）
  --dry-run   変更を適用せずに確認のみ（fix/importで使用）

例:
  bun run scripts/preset-manager.ts find --local
  bun run scripts/preset-manager.ts fix --local --dry-run
  bun run scripts/preset-manager.ts export --local
  bun run scripts/preset-manager.ts import --local
`)
    return
  }

  try {
    const db = createDb(isLocal)
    console.log(`🔗 Using ${isLocal ? 'local' : 'cloud'} database`)

    switch (command) {
      case 'find':
      case 'fix':
        await processRomajiIssues(db, command === 'fix', isDryRun)
        break
      case 'export':
        await exportPresets(db)
        break
      case 'import':
        await importPresets(db, isDryRun)
        break
    }
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
