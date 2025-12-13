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
import { Trash } from '@phosphor-icons/react'
import { Pencil } from 'lucide-react'
import { Word } from '@/lib/types'
import { AddWordDialog } from '@/components/AddWordDialog'

type SortOrder = 'accuracy' | 'createdAt'

interface WordListProps {
  words: Word[]
  onDeleteWord: (id: string) => void
  onEditWord?: (id: string, word: { text: string; reading: string; romaji: string }) => void
  showSortAndPagination?: boolean
}

const WORDS_PER_PAGE = 50

export function WordList({ words, onDeleteWord, onEditWord, showSortAndPagination = true }: WordListProps) {
  const { t } = useTranslation('words')
  
  const [sortOrder, setSortOrder] = useState<SortOrder>('accuracy')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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

  const sortedWords = useMemo(() => {
    const sorted = [...words]
    if (sortOrder === 'accuracy') {
      // Sort by accuracy (worst first), then by miss count (more misses first)
      sorted.sort((a, b) => {
        if (a.stats.accuracy === b.stats.accuracy) {
          return b.stats.miss - a.stats.miss
        }
        return a.stats.accuracy - b.stats.accuracy
      })
    } else {
      // Sort by createdAt (newest first)
      sorted.sort((a, b) => b.stats.createdAt - a.stats.createdAt)
    }
    return sorted
  }, [words, sortOrder])

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
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
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
              {t('n_words', { count: words.length })}
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
              </SelectContent>
              </Select>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </div>
          )}
        </div>
      )}

      <div className="space-y-1">
        {paginatedWords.map((word, index) => {
          const hasStats = word.stats.correct + word.stats.miss > 0
          const accuracy = Math.round(word.stats.accuracy)
          
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
              
              {/* Edit button */}
              {onEditWord && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEditClick(word)}
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
              
              {/* Delete button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDeleteWord(word.id)}
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </motion.div>
          )
        })}
      </div>

      {showSortAndPagination && totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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
    </motion.div>
  )
}
