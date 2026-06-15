import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { Trash2, Pencil, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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
import { Word } from '@/lib/types'
import { AddWordDialog } from '@/components/AddWordDialog'

type SortOrder = 'accuracy' | 'createdAt' | 'practiceCountDesc' | 'practiceCountAsc'

interface WordListProps {
  words: Word[]
  onDeleteWord: (id: string) => void
  onEditWord?: (id: string, word: { text: string; reading: string; romaji: string }) => void
  showSortAndPagination?: boolean
  searchQuery?: string
  onStartPractice?: (word: Word) => void
}

const WORDS_PER_PAGE = 50

export function WordList({
  words,
  onDeleteWord,
  onEditWord,
  showSortAndPagination = true,
  searchQuery = '',
  onStartPractice,
}: WordListProps) {
  const { t } = useTranslation('words')

  const [sortOrder, setSortOrder] = useState<SortOrder>('accuracy')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deletingWord, setDeletingWord] = useState<Word | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDeleteClick = (word: Word) => {
    setDeletingWord(word)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deletingWord) {
      onDeleteWord(deletingWord.id)
    }
    setIsDeleteDialogOpen(false)
    setDeletingWord(null)
  }

  const handleEditClick = (word: Word) => {
    setEditingWord(word)
    setIsEditDialogOpen(true)
  }

  const handleEditDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (!open) {
      setEditingWord(null)
    }
  }

  // Filter words by search query
  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return words
    const query = searchQuery.toLowerCase().trim()
    return words.filter(
      word =>
        word.text.toLowerCase().includes(query) ||
        word.reading.toLowerCase().includes(query) ||
        word.romaji.toLowerCase().includes(query)
    )
  }, [words, searchQuery])

  const sortedWords = useMemo(() => {
    const sorted = [...filteredWords]
    if (sortOrder === 'accuracy') {
      // Sort by accuracy (worst first), then by miss count (more misses first)
      sorted.sort((a, b) => {
        if (a.stats.accuracy === b.stats.accuracy) {
          return b.stats.miss - a.stats.miss
        }
        return a.stats.accuracy - b.stats.accuracy
      })
    } else if (sortOrder === 'createdAt') {
      // Sort by createdAt (newest first)
      sorted.sort((a, b) => b.stats.createdAt - a.stats.createdAt)
    } else if (sortOrder === 'practiceCountDesc') {
      // Sort by practice count (most practiced first)
      sorted.sort((a, b) => {
        const aCount = a.stats.correct + a.stats.miss
        const bCount = b.stats.correct + b.stats.miss
        return bCount - aCount
      })
    } else if (sortOrder === 'practiceCountAsc') {
      // Sort by practice count (least practiced first)
      sorted.sort((a, b) => {
        const aCount = a.stats.correct + a.stats.miss
        const bCount = b.stats.correct + b.stats.miss
        return aCount - bCount
      })
    }
    return sorted
  }, [filteredWords, sortOrder])

  const totalPages = Math.ceil(sortedWords.length / WORDS_PER_PAGE)

  const paginatedWords = useMemo(() => {
    if (!showSortAndPagination) return sortedWords
    const startIndex = (currentPage - 1) * WORDS_PER_PAGE
    return sortedWords.slice(startIndex, startIndex + WORDS_PER_PAGE)
  }, [sortedWords, currentPage, showSortAndPagination])

  // Reset to page 1 when sort order changes or words change significantly
  const handleSortChange = (value: SortOrder) => {
    setSortOrder(value)
    setCurrentPage(1)
  }

  // 検索クエリが変わったらページを1に戻す。
  // effect 内の setState ではなく、レンダー中に前回値と比較して同期する。
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery)
  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery)
    setCurrentPage(1)
  }

  if (words.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6 text-center text-muted-foreground">
          <p>{t('no_words')}</p>
        </Card>
      </motion.div>
    )
  }

  const renderPaginationItems = () => {
    const items: React.ReactNode[] = []
    const showEllipsisStart = currentPage > 3
    const showEllipsisEnd = currentPage < totalPages - 2

    // Always show first page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => setCurrentPage(1)}
          isActive={currentPage === 1}
          className="cursor-pointer"
        >
          1
        </PaginationLink>
      </PaginationItem>
    )

    if (showEllipsisStart) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // Show pages around current page
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      if (i === 1 || i === totalPages) continue
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    if (showEllipsisEnd) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showSortAndPagination && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {searchQuery.trim()
                ? `${filteredWords.length} / ${words.length}`
                : t('n_words', { count: words.length })}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('word_list.sort_by')}:</span>
              <Select value={sortOrder} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accuracy">{t('word_list.sort_accuracy')}</SelectItem>
                  <SelectItem value="createdAt">{t('word_list.sort_newest')}</SelectItem>
                  <SelectItem value="practiceCountDesc">
                    {t('word_list.sort_practice_count_desc')}
                  </SelectItem>
                  <SelectItem value="practiceCountAsc">
                    {t('word_list.sort_practice_count_asc')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* 検索結果なしの表示 */}
      {searchQuery.trim() && filteredWords.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <p>{t('word_list.no_results')}</p>
        </Card>
      ) : (
        <div className="space-y-1">
          {paginatedWords.map((word, index) => {
            const hasStats = word.stats.correct + word.stats.miss > 0
            const accuracy = Math.round(word.stats.accuracy)
            const practiceCount = word.stats.correct + word.stats.miss

            return (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.5) }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                {/* Keyword & Reading */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium text-sm truncate">{word.text}</span>
                  <span className="text-sm text-muted-foreground truncate">({word.reading})</span>
                </div>

                {/* Practice count */}
                <div className="flex items-center gap-1 w-16 shrink-0 justify-end">
                  {practiceCount > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {t('word_list.practice_count', { count: practiceCount })}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>

                {/* Accuracy with progress bar */}
                <div className="flex items-center gap-2 w-24 shrink-0">
                  {hasStats ? (
                    <>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            accuracy >= 80
                              ? 'bg-green-500'
                              : accuracy >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {accuracy}%
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>

                {/* Practice button - text display */}
                {onStartPractice && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onStartPractice(word)}
                    className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 shrink-0 text-xs"
                  >
                    {t('word_list.practice')}
                  </Button>
                )}

                {/* Actions dropdown menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={t('word_list.actions_for', { word: word.text })}
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <MoreVertical className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEditWord && (
                      <DropdownMenuItem onClick={() => handleEditClick(word)}>
                        <Pencil className="w-4 h-4 mr-2" aria-hidden="true" />
                        {t('word_list.edit')}
                      </DropdownMenuItem>
                    )}
                    {onEditWord && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(word)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                      {t('word_list.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )
          })}
        </div>
      )}

      {showSortAndPagination && totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={
                  currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Edit Dialog */}
      {onEditWord && (
        <AddWordDialog
          onAddWord={() => {}} // Not used in edit mode
          onEditWord={onEditWord}
          editingWord={editingWord}
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
          showTrigger={false}
        />
      )}

      {/* 単語削除の確認ダイアログ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('word_list.delete_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('word_list.delete_confirm_description', { word: deletingWord?.text ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('word_list.delete_cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('word_list.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
