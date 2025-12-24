import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AddWordDialog } from '@/components/AddWordDialog'
import { WordList } from '@/components/WordList'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Container } from '@/components/Container'
import { SavePresetDialog } from '@/components/SavePresetDialog'
import { Word, PresetWord } from '@/lib/types'
import { Trash2, MoreVertical, Package, Search, Save } from 'lucide-react'
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
  onLoadPreset: (
    words: PresetWord[],
    options: { clearExisting?: boolean; presetName?: string }
  ) => Promise<unknown>
  onClearAllWords: () => Promise<void>
  onSavePreset: (
    name: string,
    description: string,
    difficulty: 'easy' | 'normal' | 'hard'
  ) => Promise<void>
  onNavigate?: (view: 'presets') => void
  onStartPractice?: (word: Word) => void
}

export function WordManagementScreen({
  words,
  onAddWord,
  onEditWord,
  onDeleteWord,
  onClearAllWords,
  onSavePreset,
  onNavigate,
  onStartPractice,
}: WordManagementScreenProps) {
  const { t } = useTranslation('words')
  const { t: tc } = useTranslation('common')
  const [isClearing, setIsClearing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [savePresetDialogOpen, setSavePresetDialogOpen] = useState(false)

  const handleNavigateToPresets = () => {
    if (onNavigate) {
      onNavigate('presets')
    }
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
            <div className="flex gap-2 items-center flex-1 max-w-md ml-4">
              {/* 検索バー */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('word_list.search_placeholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              {/* ドロップダウンメニュー（全画面サイズ共通） */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleNavigateToPresets}>
                    <Package className="w-4 h-4 mr-2" />
                    {t('preset')}
                  </DropdownMenuItem>
                  {words.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSavePresetDialogOpen(true)}>
                        <Save className="w-4 h-4 mr-2" />
                        {t('save_preset', { defaultValue: 'プリセットとして保存' })}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('delete_all')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <AddWordDialog onAddWord={onAddWord} />
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

      <SavePresetDialog
        open={savePresetDialogOpen}
        onOpenChange={setSavePresetDialogOpen}
        words={words}
        onSave={onSavePreset}
      />

      {words.length === 0 ? (
        <Card className="p-8 text-center space-y-4">
          <p className="text-muted-foreground">{t('no_words')}</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {onNavigate && (
              <Button variant="outline" onClick={handleNavigateToPresets} className="gap-2">
                <Package className="h-4 w-4" />
                {t('preset')}
              </Button>
            )}
            <AddWordDialog onAddWord={onAddWord} />
          </div>
        </Card>
      ) : (
        <>
          <WordList
            words={words}
            onDeleteWord={onDeleteWord}
            onEditWord={onEditWord}
            searchQuery={searchQuery}
            onStartPractice={onStartPractice}
          />
        </>
      )}
    </Container>
  )
}
