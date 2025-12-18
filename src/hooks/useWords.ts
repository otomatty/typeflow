import { useCallback, useEffect, useState } from 'react'
import {
  getAllWords,
  addWord as addWordApi,
  deleteWord as deleteWordApi,
  updateWord,
  bulkInsertWords,
  bulkInsertWordsWithStats,
  deleteAllWords,
  WordRecord,
  type BulkInsertWordWithStats,
} from '@/lib/db'
import { Word, PresetWord } from '@/lib/types'
import { toast } from 'sonner'
import { updateMasteryLevel, calculateNextReviewAt } from '@/lib/srs-utils'

// Convert database record to Word type
function toWord(record: WordRecord): Word {
  return {
    id: String(record.id),
    text: record.text,
    reading: record.reading,
    romaji: record.romaji,
    stats: {
      correct: record.correct,
      miss: record.miss,
      lastPlayed: record.lastPlayed,
      accuracy: record.accuracy,
      createdAt: record.createdAt || Date.now(),
      masteryLevel: record.masteryLevel ?? 0,
      nextReviewAt: record.nextReviewAt ?? 0,
      consecutiveCorrect: record.consecutiveCorrect ?? 0,
    },
  }
}

export function useWords() {
  const [words, setWords] = useState<Word[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // データを取得
  const fetchWords = useCallback(async () => {
    try {
      const records = await getAllWords()
      setWords(records.map(toWord))
    } catch (error) {
      console.error('Failed to fetch words:', error)
      toast.error('Failed to load words. Is the server running?')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初回ロード
  useEffect(() => {
    fetchWords()
  }, [fetchWords])

  const addWord = useCallback(
    async (wordData: Omit<Word, 'id' | 'stats'>) => {
      try {
        await addWordApi({
          text: wordData.text,
          reading: wordData.reading,
          romaji: wordData.romaji,
          correct: 0,
          miss: 0,
          lastPlayed: 0,
          accuracy: 100,
          createdAt: Date.now(),
          masteryLevel: 0,
          nextReviewAt: 0,
          consecutiveCorrect: 0,
        })
        toast.success('Word added successfully!')
        // データを再取得
        await fetchWords()
      } catch (error) {
        console.error('Failed to add word:', error)
        toast.error('Failed to add word')
      }
    },
    [fetchWords]
  )

  const deleteWord = useCallback(
    async (id: string) => {
      try {
        await deleteWordApi(Number(id))
        toast.success('Word deleted')
        // データを再取得
        await fetchWords()
      } catch (error) {
        console.error('Failed to delete word:', error)
        toast.error('Failed to delete word')
      }
    },
    [fetchWords]
  )

  const editWord = useCallback(
    async (id: string, wordData: { text: string; reading: string; romaji: string }) => {
      try {
        await updateWord(Number(id), {
          text: wordData.text,
          reading: wordData.reading,
          romaji: wordData.romaji,
        })
        toast.success('Word updated successfully!')
        // データを再取得
        await fetchWords()
      } catch (error) {
        console.error('Failed to edit word:', error)
        toast.error('Failed to edit word')
      }
    },
    [fetchWords]
  )

  const updateWordStats = useCallback(
    async (wordId: string, correct: boolean) => {
      try {
        const id = Number(wordId)
        const word = words.find(w => w.id === wordId)
        if (!word) return

        const newCorrect = correct ? word.stats.correct + 1 : word.stats.correct
        const newMiss = correct ? word.stats.miss : word.stats.miss + 1
        const total = newCorrect + newMiss
        const accuracy = total > 0 ? (newCorrect / total) * 100 : 100

        // SRS（間隔反復）の更新
        const { newLevel, newConsecutiveCorrect } = updateMasteryLevel(
          word.stats.masteryLevel,
          correct,
          word.stats.consecutiveCorrect
        )
        const now = Date.now()
        const nextReviewAt = calculateNextReviewAt(newLevel, now)

        await updateWord(id, {
          correct: newCorrect,
          miss: newMiss,
          lastPlayed: now,
          accuracy,
          masteryLevel: newLevel,
          nextReviewAt,
          consecutiveCorrect: newConsecutiveCorrect,
        })
        // データを再取得
        await fetchWords()
      } catch (error) {
        console.error('Failed to update word stats:', error)
      }
    },
    [words, fetchWords]
  )

  // プリセットを読み込む
  const loadPreset = useCallback(
    async (
      presetWords: PresetWord[],
      options: { clearExisting?: boolean; presetName?: string } = {}
    ) => {
      const { clearExisting = false, presetName = 'プリセット' } = options

      try {
        const result = await bulkInsertWords(presetWords, clearExisting)

        if (result.success) {
          toast.success(`${presetName}を読み込みました（${result.insertedCount}件）`)
          await fetchWords()
        } else {
          toast.error('プリセットの読み込みに失敗しました')
        }

        return result
      } catch (error) {
        console.error('Failed to load preset:', error)
        toast.error('プリセットの読み込みに失敗しました')
        throw error
      }
    },
    [fetchWords]
  )

  // 全単語を削除
  const clearAllWords = useCallback(async () => {
    try {
      await deleteAllWords()
      toast.success('すべての単語を削除しました')
      await fetchWords()
    } catch (error) {
      console.error('Failed to clear words:', error)
      toast.error('単語の削除に失敗しました')
    }
  }, [fetchWords])

  // ユーザープリセットを読み込む（統計データも復元）
  const loadUserPreset = useCallback(
    async (
      presetWords: Array<{
        text: string
        reading: string
        romaji: string
        stats: {
          correct: number
          miss: number
          lastPlayed: number
          accuracy: number
          masteryLevel: number
          nextReviewAt: number
          consecutiveCorrect: number
        }
      }>,
      options: { clearExisting?: boolean; presetName?: string } = {}
    ) => {
      const { clearExisting = false, presetName = 'ユーザープリセット' } = options

      try {
        const wordsWithStats: BulkInsertWordWithStats[] = presetWords.map(word => ({
          text: word.text,
          reading: word.reading,
          romaji: word.romaji,
          correct: word.stats.correct,
          miss: word.stats.miss,
          lastPlayed: word.stats.lastPlayed,
          accuracy: word.stats.accuracy,
          masteryLevel: word.stats.masteryLevel,
          nextReviewAt: word.stats.nextReviewAt,
          consecutiveCorrect: word.stats.consecutiveCorrect,
        }))

        const result = await bulkInsertWordsWithStats(wordsWithStats, clearExisting)

        if (result.success) {
          toast.success(`${presetName}を読み込みました（${result.insertedCount}件）`)
          await fetchWords()
        } else {
          toast.error('プリセットの読み込みに失敗しました')
        }

        return result
      } catch (error) {
        console.error('Failed to load user preset:', error)
        toast.error('プリセットの読み込みに失敗しました')
        throw error
      }
    },
    [fetchWords]
  )

  return {
    words,
    isLoading,
    addWord,
    editWord,
    deleteWord,
    updateWordStats,
    loadPreset,
    loadUserPreset,
    clearAllWords,
    refetch: fetchWords,
  }
}
