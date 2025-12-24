/**
 * CLI Local Database Client
 * ローカルDBを直接読み書き（認証不要）
 */

import { createClient, type Client } from '@libsql/client'
import type { CLIWord, CLIGameScore, CLISettings } from './types'
import { DEFAULT_SETTINGS } from './api'
import { resolve } from 'path'

export class LocalDBClient {
  private client: Client

  constructor(dbPath?: string) {
    // プロジェクトルートのlocal.dbを使用
    const fullPath = dbPath || resolve(process.cwd(), 'local.db')

    this.client = createClient({
      url: `file:${fullPath}`,
    })
  }

  /**
   * 全単語を取得
   */
  async getWords(): Promise<CLIWord[]> {
    const result = await this.client.execute('SELECT * FROM words')
    return result.rows.map(row => ({
      id: row.id as number,
      text: row.text as string,
      reading: row.reading as string,
      romaji: row.romaji as string,
      correct: row.correct as number,
      miss: row.miss as number,
      lastPlayed: row.lastPlayed as number,
      accuracy: row.accuracy as number,
      createdAt: row.createdAt as number,
      masteryLevel: row.masteryLevel as number,
      nextReviewAt: row.nextReviewAt as number,
      consecutiveCorrect: row.consecutiveCorrect as number,
    }))
  }

  /**
   * 設定を取得
   */
  async getSettings(): Promise<CLISettings | null> {
    try {
      const result = await this.client.execute('SELECT * FROM settings WHERE id = 1')
      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
        wordCount: row.wordCount as number | 'all',
        theme: row.theme as string,
        practiceMode: row.practiceMode as string,
        srsEnabled: Boolean(row.srsEnabled),
        warmupEnabled: Boolean(row.warmupEnabled),
        difficultyPreset: row.difficultyPreset as string,
        targetKpsMultiplier: row.targetKpsMultiplier as number,
        comfortZoneRatio: row.comfortZoneRatio as number,
        minTimeLimit: row.minTimeLimit as number,
        maxTimeLimit: row.maxTimeLimit as number,
        minTimeLimitByDifficulty: row.minTimeLimitByDifficulty as number,
        missPenaltyEnabled: Boolean(row.missPenaltyEnabled),
        basePenaltyPercent: row.basePenaltyPercent as number,
        penaltyEscalationFactor: row.penaltyEscalationFactor as number,
        maxPenaltyPercent: row.maxPenaltyPercent as number,
        minTimeAfterPenalty: row.minTimeAfterPenalty as number,
      }
    } catch {
      return null
    }
  }

  /**
   * ゲームスコアを取得
   */
  async getGameScores(): Promise<CLIGameScore[]> {
    try {
      const result = await this.client.execute('SELECT * FROM game_scores ORDER BY playedAt DESC')
      return result.rows.map(row => ({
        id: row.id as number,
        kps: row.kps as number,
        totalKeystrokes: row.totalKeystrokes as number,
        accuracy: row.accuracy as number,
        completedWords: row.completedWords as number,
        successfulWords: row.successfulWords as number,
        totalWords: row.totalWords as number,
        totalTime: row.totalTime as number,
        playedAt: row.playedAt as number,
      }))
    } catch {
      return []
    }
  }

  /**
   * ゲームスコアを保存
   */
  async saveGameScore(score: Omit<CLIGameScore, 'id' | 'playedAt'>): Promise<number> {
    const now = Date.now()
    const result = await this.client.execute({
      sql: `INSERT INTO game_scores (kps, totalKeystrokes, accuracy, completedWords, successfulWords, totalWords, totalTime, playedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        score.kps,
        score.totalKeystrokes,
        score.accuracy,
        score.completedWords,
        score.successfulWords,
        score.totalWords,
        score.totalTime,
        now,
      ],
    })
    return Number(result.lastInsertRowid)
  }

  /**
   * 単語の統計を更新
   */
  async updateWordStats(id: number, correct: boolean): Promise<void> {
    // 現在の単語を取得
    const result = await this.client.execute({
      sql: 'SELECT * FROM words WHERE id = ?',
      args: [id],
    })

    if (result.rows.length === 0) return

    const word = result.rows[0]
    const newCorrect = correct ? (word.correct as number) + 1 : (word.correct as number)
    const newMiss = correct ? (word.miss as number) : (word.miss as number) + 1
    const total = newCorrect + newMiss
    const accuracy = total > 0 ? (newCorrect / total) * 100 : 100

    await this.client.execute({
      sql: `UPDATE words SET correct = ?, miss = ?, lastPlayed = ?, accuracy = ? WHERE id = ?`,
      args: [newCorrect, newMiss, Date.now(), accuracy, id],
    })
  }

  /**
   * DBが存在するかチェック
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.execute('SELECT 1')
      return true
    } catch {
      return false
    }
  }

  /**
   * 接続を閉じる
   */
  close(): void {
    this.client.close()
  }
}

// デフォルト設定をエクスポート
export { DEFAULT_SETTINGS }
