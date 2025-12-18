import { useState, useEffect, useCallback } from 'react'
import {
  getAllUserPresets,
  getUserPresetById,
  createUserPreset,
  deleteUserPreset,
  type UserPresetRecord,
  type CreateUserPresetInput,
} from '@/lib/db'
import { toast } from 'sonner'
import type { Word } from '@/lib/types'

/**
 * ユーザープリセット管理用のカスタムフック
 * 現在の単語リストと統計データを保存・復元できます
 */
export function useUserPresets() {
  const [presets, setPresets] = useState<UserPresetRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // プリセット一覧を取得
  const fetchPresets = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const fetchedPresets = await getAllUserPresets()
      setPresets(fetchedPresets)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user presets')
      setError(error)
      console.error('Failed to fetch user presets:', error)
      setPresets([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // プリセットをIDで取得
  const getPresetById = useCallback(
    async (id: string): Promise<UserPresetRecord | undefined> => {
      try {
        // まずローカルキャッシュから検索
        const cachedPreset = presets.find(p => p.id === id)
        if (cachedPreset) {
          return cachedPreset
        }

        // キャッシュにない場合はAPIから取得
        const preset = await getUserPresetById(id)
        if (preset) {
          // キャッシュに追加
          setPresets(prev => {
            if (prev.find(p => p.id === id)) {
              return prev
            }
            return [...prev, preset]
          })
        }
        return preset
      } catch (err) {
        console.error(`Failed to fetch user preset ${id}:`, err)
        return undefined
      }
    },
    [presets]
  )

  // 現在の単語リストをプリセットとして保存
  const saveCurrentWordsAsPreset = useCallback(
    async (
      name: string,
      description: string,
      difficulty: 'easy' | 'normal' | 'hard',
      words: Word[]
    ): Promise<string | null> => {
      try {
        // IDを生成（タイムスタンプベース）
        const id = `user-preset-${Date.now()}`

        // 単語データを変換
        const presetWords = words.map(word => ({
          text: word.text,
          reading: word.reading,
          romaji: word.romaji,
          stats: {
            correct: word.stats.correct,
            miss: word.stats.miss,
            lastPlayed: word.stats.lastPlayed,
            accuracy: word.stats.accuracy,
            masteryLevel: word.stats.masteryLevel,
            nextReviewAt: word.stats.nextReviewAt,
            consecutiveCorrect: word.stats.consecutiveCorrect,
          },
        }))

        const input: CreateUserPresetInput = {
          id,
          name,
          description,
          difficulty,
          words: presetWords,
        }

        await createUserPreset(input)
        toast.success('プリセットを保存しました')
        // 一覧を再取得
        await fetchPresets()
        return id
      } catch (err) {
        console.error('Failed to save user preset:', err)
        toast.error('プリセットの保存に失敗しました')
        return null
      }
    },
    [fetchPresets]
  )

  // プリセットを削除
  const removePreset = useCallback(
    async (id: string) => {
      try {
        await deleteUserPreset(id)
        toast.success('プリセットを削除しました')
        // 一覧を再取得
        await fetchPresets()
      } catch (err) {
        console.error('Failed to delete user preset:', err)
        toast.error('プリセットの削除に失敗しました')
      }
    },
    [fetchPresets]
  )

  // 初回マウント時にプリセットを取得
  useEffect(() => {
    fetchPresets()
  }, [fetchPresets])

  return {
    presets,
    isLoading,
    error,
    refetch: fetchPresets,
    getPresetById,
    saveCurrentWordsAsPreset,
    removePreset,
  }
}
