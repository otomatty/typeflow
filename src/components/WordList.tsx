import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash } from '@phosphor-icons/react'
import { Word } from '@/lib/types'

interface WordListProps {
  words: Word[]
  onDeleteWord: (id: string) => void
}

export function WordList({ words, onDeleteWord }: WordListProps) {
  if (words.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>No words yet. Add some words to start practicing!</p>
      </Card>
    )
  }

  const sortedWords = [...words].sort((a, b) => {
    if (a.stats.accuracy === b.stats.accuracy) {
      return b.stats.miss - a.stats.miss
    }
    return a.stats.accuracy - b.stats.accuracy
  })

  return (
    <div className="space-y-2">
      {sortedWords.map((word) => (
        <Card key={word.id} className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-bold text-sm sm:text-base truncate">{word.text}</span>
                {word.stats.correct + word.stats.miss > 0 && (
                  <Badge variant={word.stats.accuracy < 70 ? 'destructive' : 'secondary'}>
                    {Math.round(word.stats.accuracy)}%
                  </Badge>
                )}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground space-y-0.5">
                <div>{word.reading}</div>
                <div className="font-mono">{word.romaji}</div>
              </div>
              {word.stats.correct + word.stats.miss > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  ✓ {word.stats.correct} / ✗ {word.stats.miss}
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDeleteWord(word.id)}
              className="text-accent hover:text-accent hover:bg-accent/10 shrink-0"
            >
              <Trash />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
