import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddWordDialog } from '@/components/AddWordDialog'
import { PresetDialog } from '@/components/PresetDialog'
import { CSVImportDialog } from '@/components/CSVImportDialog'
import { WordList } from '@/components/WordList'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Container } from '@/components/Container'
import { Word, PresetWord } from '@/lib/types'
import { Trash } from '@phosphor-icons/react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface WordManagementScreenProps {
  words: Word[]
  onAddWord: (wordData: Omit<Word, 'id' | 'stats'>) => void
  onEditWord: (id: string, word: { text: string; reading: string; romaji: string }) => void
  onDeleteWord: (id: string) => void
  onLoadPreset: (words: PresetWord[], options: { clearExisting?: boolean; presetName?: string }) => Promise<unknown>
  onClearAllWords: () => Promise<void>
}

export function WordManagementScreen({ 
  words, 
  onAddWord,
  onEditWord,
  onDeleteWord,
  onLoadPreset,
  onClearAllWords,
}: WordManagementScreenProps) {
  const { t } = useTranslation('words')
  const { t: tc } = useTranslation('common')
  const [isClearing, setIsClearing] = useState(false)

  const handleLoadPreset = async (
    presetWords: PresetWord[], 
    options: { clearExisting: boolean; presetName: string }
  ) => {
    await onLoadPreset(presetWords, options)
  }

  const handleClearAll = async () => {
    setIsClearing(true)
    try {
      await onClearAllWords()
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <Container maxWidth="4xl">
      <div className="mb-6">
        <ScreenHeader
          title={t('title')}
          description={t('description')}
          action={
            <div className="flex gap-2">
              {words.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash className="w-4 h-4 mr-1" />
                      {t('delete_all')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('delete_all_confirm')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('delete_all_desc', { count: words.length })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearAll}
                        disabled={isClearing}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isClearing ? t('deleting') : t('delete_confirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <PresetDialog onLoadPreset={handleLoadPreset} />
              <CSVImportDialog onImport={handleLoadPreset} />
              <AddWordDialog onAddWord={onAddWord} />
            </div>
          }
        />
      </div>

      {words.length === 0 ? (
        <Card className="p-8 text-center space-y-4">
          <p className="text-muted-foreground">
            {t('no_words')}
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <PresetDialog onLoadPreset={handleLoadPreset} />
            <CSVImportDialog onImport={handleLoadPreset} />
            <AddWordDialog onAddWord={onAddWord} />
          </div>
        </Card>
      ) : (
        <>
          <WordList words={words} onDeleteWord={onDeleteWord} onEditWord={onEditWord} />
        </>
      )}
    </Container>
  )
}
