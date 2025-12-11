import Dexie, { type EntityTable } from 'dexie'

// Word interface for database
export interface WordRecord {
  id: number
  text: string
  reading: string
  romaji: string
  correct: number
  miss: number
  lastPlayed: number
  accuracy: number
  createdAt: number
}

// Database class
class TypeFlowDatabase extends Dexie {
  words!: EntityTable<WordRecord, 'id'>

  constructor() {
    super('TypeFlowDB')
    
    this.version(1).stores({
      words: '++id, text, reading, romaji, accuracy, lastPlayed, createdAt'
    })
  }
}

// Database singleton
export const db = new TypeFlowDatabase()

// Helper functions for CRUD operations
export async function getAllWords(): Promise<WordRecord[]> {
  return await db.words.toArray()
}

export async function addWord(word: Omit<WordRecord, 'id'>): Promise<number> {
  return await db.words.add(word as WordRecord)
}

export async function deleteWord(id: number): Promise<void> {
  await db.words.delete(id)
}

export async function updateWord(id: number, updates: Partial<WordRecord>): Promise<void> {
  await db.words.update(id, updates)
}

export async function updateWordStats(id: number, correct: boolean): Promise<void> {
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
}
