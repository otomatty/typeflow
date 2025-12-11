export interface Word {
  id: string
  text: string
  reading: string
  romaji: string
  stats: {
    correct: number
    miss: number
    lastPlayed: number
    accuracy: number
  }
}

export interface GameState {
  isPlaying: boolean
  currentWordIndex: number
  currentInput: string
  timeRemaining: number
  totalTime: number
  words: Word[]
  mistakeWords: string[]
  correctCount: number
  totalKeystrokes: number
  startTime: number | null
}

export interface GameStats {
  wpm: number
  accuracy: number
  correctWords: number
  totalWords: number
  totalTime: number
}
