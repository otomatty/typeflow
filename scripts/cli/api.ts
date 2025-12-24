/**
 * CLI API Client
 * APIサーバーとの通信
 */

import type { CLIWord, CLIGameScore, CLISettings } from './types'

const DEFAULT_API_BASE = 'http://localhost:3456/api'

export class APIClient {
  private baseUrl: string

  constructor(baseUrl: string = DEFAULT_API_BASE) {
    this.baseUrl = baseUrl
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 全単語を取得
   */
  async getWords(): Promise<CLIWord[]> {
    return this.fetch<CLIWord[]>('/words')
  }

  /**
   * 設定を取得
   */
  async getSettings(): Promise<CLISettings | null> {
    return this.fetch<CLISettings | null>('/settings')
  }

  /**
   * ゲームスコアを取得
   */
  async getGameScores(): Promise<CLIGameScore[]> {
    return this.fetch<CLIGameScore[]>('/scores')
  }

  /**
   * ゲームスコアを保存
   */
  async saveGameScore(score: Omit<CLIGameScore, 'id' | 'playedAt'>): Promise<number> {
    const result = await this.fetch<{ id: number }>('/scores', {
      method: 'POST',
      body: JSON.stringify(score),
    })
    return result.id
  }

  /**
   * 単語の統計を更新
   */
  async updateWordStats(id: number, correct: boolean): Promise<void> {
    // まず現在の単語を取得
    const words = await this.getWords()
    const word = words.find(w => w.id === id)
    if (!word) return

    const newCorrect = correct ? word.correct + 1 : word.correct
    const newMiss = correct ? word.miss : word.miss + 1
    const total = newCorrect + newMiss
    const accuracy = total > 0 ? (newCorrect / total) * 100 : 100

    await this.fetch(`/words/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        correct: newCorrect,
        miss: newMiss,
        lastPlayed: Date.now(),
        accuracy,
      }),
    })
  }

  /**
   * サーバーの状態確認
   */
  async healthCheck(): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl.replace('/api', '')}/health`)
      return true
    } catch {
      return false
    }
  }
}

// デフォルト設定（API取得失敗時のフォールバック）
export const DEFAULT_SETTINGS: CLISettings = {
  wordCount: 20,
  theme: 'dark',
  practiceMode: 'random',
  srsEnabled: true,
  warmupEnabled: true,
  difficultyPreset: 'normal',
  targetKpsMultiplier: 1.4,
  comfortZoneRatio: 0.95,
  minTimeLimit: 2.0,
  maxTimeLimit: 15,
  minTimeLimitByDifficulty: 2.0,
  missPenaltyEnabled: true,
  basePenaltyPercent: 12,
  penaltyEscalationFactor: 2.2,
  maxPenaltyPercent: 55,
  minTimeAfterPenalty: 0.15,
}
