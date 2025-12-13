import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Warning } from '@phosphor-icons/react'
import { processTextForTyping, containsKanji } from '@/lib/japanese-utils'
import { Word } from '@/lib/types'

interface AddWordDialogProps {
  onAddWord: (word: Omit<Word, 'id' | 'stats'>) => void
  /** 編集モードで使用する場合 */
  onEditWord?: (id: string, word: { text: string; reading: string; romaji: string }) => void
  /** 編集する単語（指定すると編集モードになる） */
  editingWord?: Word | null
  /** 外部から制御する場合のopen状態 */
  open?: boolean
  /** 外部から制御する場合のonOpenChange */
  onOpenChange?: (open: boolean) => void
  /** トリガーボタンを表示するかどうか（デフォルト: true） */
  showTrigger?: boolean
}

export function AddWordDialog({ 
  onAddWord, 
  onEditWord,
  editingWord,
  open: controlledOpen, 
  onOpenChange, 
  showTrigger = true 
}: AddWordDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  // 制御モードかどうか
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen
  const [text, setText] = useState('')
  const [reading, setReading] = useState('')
  const [romaji, setRomaji] = useState('')
  const [needsManualReading, setNeedsManualReading] = useState(false)
  
  const isEditMode = !!editingWord
  
  // 編集モードの場合、初期値を設定
  useEffect(() => {
    if (editingWord && open) {
      setText(editingWord.text)
      setReading(editingWord.reading)
      setRomaji(editingWord.romaji)
      setNeedsManualReading(containsKanji(editingWord.text))
    }
  }, [editingWord, open])

  // Process text when it changes
  useEffect(() => {
    if (!text.trim()) {
      setReading('')
      setRomaji('')
      setNeedsManualReading(false)
      return
    }

    const result = processTextForTyping(text)
    
    if (result.needsManualReading) {
      setNeedsManualReading(true)
      // Don't overwrite if user has already entered reading
      if (!reading) {
        setReading('')
        setRomaji('')
      }
    } else {
      setNeedsManualReading(false)
      setReading(result.reading)
      setRomaji(result.romaji)
    }
  }, [text])

  // Update romaji when reading changes (for manual input)
  useEffect(() => {
    if (reading && needsManualReading) {
      const result = processTextForTyping(text, reading)
      setRomaji(result.romaji)
    }
  }, [reading, needsManualReading, text])

  const handleTextChange = (value: string) => {
    setText(value)
  }

  const handleReadingChange = (value: string) => {
    setReading(value)
    // Update romaji based on new reading
    const result = processTextForTyping(text, value)
    setRomaji(result.romaji)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!text.trim()) return
    
    // Validate that reading is provided for kanji
    if (containsKanji(text) && !reading.trim()) {
      return
    }

    const finalReading = reading.trim() || text.trim()
    const finalRomaji = romaji.trim() || finalReading.toLowerCase()

    if (isEditMode && editingWord && onEditWord) {
      // 編集モード
      onEditWord(editingWord.id, {
        text: text.trim(),
        reading: finalReading,
        romaji: finalRomaji,
      })
    } else {
      // 追加モード
      onAddWord({
        text: text.trim(),
        reading: finalReading,
        romaji: finalRomaji,
      })
    }

    setText('')
    setReading('')
    setRomaji('')
    setNeedsManualReading(false)
    setOpen(false)
  }

  const isValid = text.trim() && (!needsManualReading || reading.trim())

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus weight="bold" />
            <span className="hidden sm:inline">Add Word</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Word' : 'Add New Word'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Word / Text</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="例: Promise.all, 非同期処理, ひらがな"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reading" className="flex items-center gap-2">
              Reading (Hiragana)
              {needsManualReading && (
                <span className="text-xs text-amber-500 flex items-center gap-1">
                  <Warning className="w-3 h-3" />
                  要入力
                </span>
              )}
            </Label>
            <Input
              id="reading"
              value={reading}
              onChange={(e) => handleReadingChange(e.target.value)}
              placeholder={needsManualReading ? "ひらがなで入力してください" : "自動生成"}
              className={needsManualReading && !reading ? "border-amber-500" : ""}
            />
            {needsManualReading && (
              <p className="text-xs text-muted-foreground">
                漢字を含む場合は、読み仮名を手動で入力してください
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="romaji">Romaji (for typing)</Label>
            <Input
              id="romaji"
              value={romaji}
              onChange={(e) => setRomaji(e.target.value)}
              placeholder="自動生成 / 手動入力可"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              {isEditMode ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
