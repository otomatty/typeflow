import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, WordRecord } from '@/lib/db'
import { Word } from '@/lib/types'
import { toast } from 'sonner'

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
    },
  }
}

export function useWords() {
  // Live query - automatically updates when database changes
  const wordRecords = useLiveQuery(
    () => db.words.toArray(),
    [],
    [] // Default value while loading
  )

  const words: Word[] = (wordRecords || []).map(toWord)

  const addWord = useCallback(async (wordData: Omit<Word, 'id' | 'stats'>) => {
    try {
      await db.words.add({
        text: wordData.text,
        reading: wordData.reading,
        romaji: wordData.romaji,
        correct: 0,
        miss: 0,
        lastPlayed: Date.now(),
        accuracy: 100,
        createdAt: Date.now(),
      } as WordRecord)
      toast.success('Word added successfully!')
    } catch (error) {
      console.error('Failed to add word:', error)
      toast.error('Failed to add word')
    }
  }, [])

  const deleteWord = useCallback(async (id: string) => {
    try {
      await db.words.delete(Number(id))
      toast.success('Word deleted')
    } catch (error) {
      console.error('Failed to delete word:', error)
      toast.error('Failed to delete word')
    }
  }, [])

  const updateWordStats = useCallback(async (wordId: string, correct: boolean) => {
    try {
      const id = Number(wordId)
      const word = await db.words.get(id)
      if (!word) return

      const newCorrect = correct ? word.correct + 1 : word.correct
      const newMiss = correct ? word.miss : word.miss + 1
      const total = newCorrect + newMiss
      const accuracy = total > 0 ? (newCorrect / total) * 100 : 100

      await db.words.update(id, {
        correct: newCorrect,
        miss: newMiss,
        lastPlayed: Date.now(),
        accuracy,
      })
    } catch (error) {
      console.error('Failed to update word stats:', error)
    }
  }, [])

  return {
    words,
    addWord,
    deleteWord,
    updateWordStats,
  }
}
