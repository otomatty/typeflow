import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Keyboard, ChartLine } from '@phosphor-icons/react'
import { AddWordDialog } from '@/components/AddWordDialog'
import { WordList } from '@/components/WordList'
import { Word } from '@/lib/types'

interface WordManagementScreenProps {
  words: Word[]
  onAddWord: (wordData: Omit<Word, 'id' | 'stats'>) => void
  onDeleteWord: (id: string) => void
}

export function WordManagementScreen({ words, onAddWord, onDeleteWord }: WordManagementScreenProps) {
  return (
    <div className="min-h-screen pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Word Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Add and manage your typing practice words
            </p>
          </div>
          <AddWordDialog onAddWord={onAddWord} />
        </div>

        <Tabs defaultValue="words" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="words" className="gap-2">
              <Keyboard className="w-4 h-4" />
              <span>All Words</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <ChartLine className="w-4 h-4" />
              <span>Statistics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="words" className="space-y-4">
            {words.length === 0 ? (
              <Card className="p-8 text-center space-y-4">
                <p className="text-muted-foreground">
                  No words yet. Add your first word to start practicing!
                </p>
                <AddWordDialog onAddWord={onAddWord} />
              </Card>
            ) : (
              <>
                <div className="text-sm text-muted-foreground mb-2">
                  {words.length} word{words.length !== 1 ? 's' : ''} registered
                </div>
                <WordList words={words} onDeleteWord={onDeleteWord} />
              </>
            )}
          </TabsContent>

          <TabsContent value="stats">
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Weakest Words</h3>
              {words.filter((w) => w.stats.correct + w.stats.miss > 0).length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No practice data yet. Start playing to see your statistics!
                </p>
              ) : (
                <WordList
                  words={words
                    .filter((w) => w.stats.correct + w.stats.miss > 0)
                    .sort((a, b) => a.stats.accuracy - b.stats.accuracy)
                    .slice(0, 10)}
                  onDeleteWord={onDeleteWord}
                />
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
