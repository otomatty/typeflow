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
import { Trash, DotsThreeVertical, Package, FileArrowUp } from '@phosphor-icons/react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

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
  const [presetDialogOpen, setPresetDialogOpen] = useState(false)
  const [csvDialogOpen, setCsvDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

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
              {/* モバイル: ドロップダウンメニュー */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="sm:hidden">
                    <DotsThreeVertical className="w-5 h-5" weight="bold" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setPresetDialogOpen(true)}>
                    <Package className="w-4 h-4 mr-2" />
                    {t('preset')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCsvDialogOpen(true)}>
                    <FileArrowUp className="w-4 h-4 mr-2" />
                    {t('csv.import')}
                  </DropdownMenuItem>
                  {words.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        {t('delete_all')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* デスクトップ: 通常のボタン */}
              {words.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden sm:flex text-destructive hover:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash className="w-4 h-4 mr-1" />
                  {t('delete_all')}
                </Button>
              )}
              <Button 
                variant="outline" 
                className="hidden sm:flex gap-2"
                onClick={() => setPresetDialogOpen(true)}
              >
                <Package className="w-4 h-4" />
                {t('preset')}
              </Button>
              <Button 
                variant="outline" 
                className="hidden sm:flex gap-2"
                onClick={() => setCsvDialogOpen(true)}
              >
                <FileArrowUp className="w-4 h-4" />
                {t('csv.import')}
              </Button>
              <AddWordDialog onAddWord={onAddWord} />

              {/* ダイアログ（制御モード） */}
              <PresetDialog 
                onLoadPreset={handleLoadPreset} 
                open={presetDialogOpen}
                onOpenChange={setPresetDialogOpen}
                showTrigger={false}
              />
              <CSVImportDialog 
                onImport={handleLoadPreset}
                open={csvDialogOpen}
                onOpenChange={setCsvDialogOpen}
                showTrigger={false}
              />
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
