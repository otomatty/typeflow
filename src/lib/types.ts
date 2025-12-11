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
  kps: number           // Keys Per Second (打鍵/秒)
  totalKeystrokes: number  // 総打鍵数
  accuracy: number      // 正確率 (ノーミスワード数/完了ワード数)
  correctWords: number  // 完了ワード数
  perfectWords: number  // ノーミスで完了したワード数
  totalWords: number    // 総ワード数
  totalTime: number     // 総時間（秒）
}
