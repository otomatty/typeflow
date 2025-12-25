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
      // DBカラム名はスネークケース
      const wordCount = row.word_count as string
      const difficultyPreset = (row.difficulty_preset as string) || 'normal'

      // 難易度プリセットからデフォルト値を取得（target_kps_multiplierカラムが存在しない場合）
      const difficultyDefaults: Record<
        string,
        {
          targetKpsMultiplier: number
          comfortZoneRatio: number
          minTimeLimitByDifficulty: number
          basePenaltyPercent: number
          penaltyEscalationFactor: number
          maxPenaltyPercent: number
          minTimeAfterPenalty: number
        }
      > = {
        easy: {
          targetKpsMultiplier: 1.3,
          comfortZoneRatio: 1.0,
          minTimeLimitByDifficulty: 2.5,
          basePenaltyPercent: 10,
          penaltyEscalationFactor: 2.0,
          maxPenaltyPercent: 50,
          minTimeAfterPenalty: 0.2,
        },
        normal: {
          targetKpsMultiplier: 1.4,
          comfortZoneRatio: 0.95,
          minTimeLimitByDifficulty: 2.0,
          basePenaltyPercent: 12,
          penaltyEscalationFactor: 2.2,
          maxPenaltyPercent: 55,
          minTimeAfterPenalty: 0.15,
        },
        hard: {
          targetKpsMultiplier: 1.5,
          comfortZoneRatio: 0.9,
          minTimeLimitByDifficulty: 1.8,
          basePenaltyPercent: 15,
          penaltyEscalationFactor: 2.5,
          maxPenaltyPercent: 60,
          minTimeAfterPenalty: 0.1,
        },
        expert: {
          targetKpsMultiplier: 1.65,
          comfortZoneRatio: 0.85,
          minTimeLimitByDifficulty: 1.5,
          basePenaltyPercent: 18,
          penaltyEscalationFactor: 2.8,
          maxPenaltyPercent: 65,
          minTimeAfterPenalty: 0.05,
        },
      }
      const defaults = difficultyDefaults[difficultyPreset] || difficultyDefaults.normal

      return {
        wordCount: wordCount === 'all' ? 'all' : parseInt(wordCount, 10) || 20,
        theme: row.theme as string,
        practiceMode: row.practice_mode as string,
        srsEnabled: Boolean(row.srs_enabled),
        warmupEnabled: Boolean(row.warmup_enabled),
        difficultyPreset,
        targetKpsMultiplier: (row.target_kps_multiplier as number) || defaults.targetKpsMultiplier,
        comfortZoneRatio: (row.comfort_zone_ratio as number) || defaults.comfortZoneRatio,
        minTimeLimit: (row.min_time_limit as number) || 2.0,
        maxTimeLimit: (row.max_time_limit as number) || 15,
        minTimeLimitByDifficulty:
          (row.min_time_limit_by_difficulty as number) || defaults.minTimeLimitByDifficulty,
        missPenaltyEnabled: Boolean(row.miss_penalty_enabled),
        basePenaltyPercent: (row.base_penalty_percent as number) || defaults.basePenaltyPercent,
        penaltyEscalationFactor:
          (row.penalty_escalation_factor as number) || defaults.penaltyEscalationFactor,
        maxPenaltyPercent: (row.max_penalty_percent as number) || defaults.maxPenaltyPercent,
        minTimeAfterPenalty: (row.min_time_after_penalty as number) || defaults.minTimeAfterPenalty,
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
      const result = await this.client.execute('SELECT * FROM game_scores ORDER BY played_at DESC')
      return result.rows.map(row => ({
        id: row.id as number,
        kps: row.kps as number,
        totalKeystrokes: row.total_keystrokes as number,
        accuracy: row.accuracy as number,
        completedWords: row.correct_words as number, // DBカラム名はcorrect_words
        successfulWords: row.perfect_words as number, // DBカラム名はperfect_words
        totalWords: row.total_words as number,
        totalTime: row.total_time as number,
        playedAt: row.played_at as number,
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
    await this.client.execute({
      sql: `INSERT INTO game_scores (kps, total_keystrokes, accuracy, correct_words, perfect_words, total_words, total_time, played_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        score.kps,
        score.totalKeystrokes,
        score.accuracy,
        score.completedWords, // DBカラム名はcorrect_words
        score.successfulWords, // DBカラム名はperfect_words
        score.totalWords,
        score.totalTime,
        now,
      ],
    })
    // libSQLではlastInsertRowidを取得するために別のクエリが必要
    const lastIdResult = await this.client.execute('SELECT last_insert_rowid() as id')
    return (lastIdResult.rows[0]?.id as number) ?? 0
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
      sql: `UPDATE words SET correct = ?, miss = ?, last_played = ?, accuracy = ? WHERE id = ?`,
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
