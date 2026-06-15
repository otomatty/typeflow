import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Info } from 'lucide-react'
import { processTextForTyping, containsKanji, isEnglishText } from '@/lib/japanese-utils'
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
  showTrigger = true,
}: AddWordDialogProps) {
  const { t } = useTranslation('words')
  const { t: tc } = useTranslation('common')

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

  // 編集モードでダイアログを開いたとき、対象の単語をフォームに読み込む。
  // effect 内の setState ではなく、レンダー中に適用済みキーを追跡して同期する
  // （open の開閉や編集対象の切り替えに追従しつつ、不要な再レンダーを避ける）。
  // appliedEditKey は editKey と区別できるセンチネル(undefined)で初期化し、
  // 「最初から open かつ editingWord あり」でマウントされた場合も初回ハイドレーションされるようにする。
  const editKey = open && editingWord ? editingWord.id : null
  const [appliedEditKey, setAppliedEditKey] = useState<string | null | undefined>(undefined)
  if (editKey !== appliedEditKey) {
    setAppliedEditKey(editKey)
    if (open && editingWord) {
      setText(editingWord.text)
      setReading(editingWord.reading)
      setRomaji(editingWord.romaji)
      setNeedsManualReading(containsKanji(editingWord.text))
    } else {
      // 追加モードへの切り替え、またはダイアログを閉じたときはフォームをリセットする
      setText('')
      setReading('')
      setRomaji('')
      setNeedsManualReading(false)
    }
  }

  // 本文の変更時に読み・ローマ字・手動読みフラグを導出する（旧 effect の派生処理をイベント側へ移動）。
  const handleTextChange = (value: string) => {
    setText(value)

    if (!value.trim()) {
      setReading('')
      setRomaji('')
      setNeedsManualReading(false)
      return
    }

    const result = processTextForTyping(value)

    if (result.needsManualReading) {
      setNeedsManualReading(true)
      if (reading) {
        // 既に読みが入力済みなら、新しい本文 + 既存の読みでローマ字を再計算
        setRomaji(processTextForTyping(value, reading).romaji)
      } else {
        // 読み未入力の漢字の場合は読み・ローマ字をクリア
        setReading('')
        setRomaji('')
      }
    } else {
      setNeedsManualReading(false)
      setReading(result.reading)
      setRomaji(result.romaji)
    }
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

    const trimmedText = text.trim()

    // Determine final reading and romaji
    // For English text: reading = text, romaji = text (lowercase)
    // For Japanese with reading: use the provided reading
    // For Japanese without reading: use text as fallback
    let finalReading = reading.trim()
    let finalRomaji = romaji.trim()

    if (isEnglishText(trimmedText)) {
      // English text - reading is the text itself, romaji is lowercase
      finalReading = finalReading || trimmedText
      finalRomaji = finalRomaji || trimmedText.toLowerCase()
    } else {
      // Japanese text
      finalReading = finalReading || trimmedText
      finalRomaji = finalRomaji || finalReading.toLowerCase()
    }

    if (isEditMode && editingWord && onEditWord) {
      // 編集モード
      onEditWord(editingWord.id, {
        text: trimmedText,
        reading: finalReading,
        romaji: finalRomaji,
      })
    } else {
      // 追加モード
      onAddWord({
        text: trimmedText,
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

  // 漢字を含む場合は読みの入力を必須とする（正確なローマ字生成のため）
  const missingRequiredReading = needsManualReading && !reading.trim()
  const isValid = text.trim().length > 0 && !missingRequiredReading

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button className="gap-2" aria-label={t('add_word')}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('add_word')}</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('dialog.edit_title') : t('dialog.add_title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">{t('dialog.word_text')}</Label>
            <Input
              id="text"
              value={text}
              onChange={e => handleTextChange(e.target.value)}
              placeholder={t('dialog.word_placeholder')}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reading" className="flex items-center gap-2">
              {t('dialog.reading')}
              {needsManualReading && (
                <span
                  className={`text-xs flex items-center gap-1 ${
                    missingRequiredReading ? 'text-destructive' : 'text-blue-500'
                  }`}
                >
                  <Info className="w-3 h-3" aria-hidden="true" />
                  {missingRequiredReading
                    ? t('dialog.reading_required')
                    : t('dialog.reading_recommended')}
                </span>
              )}
            </Label>
            <Input
              id="reading"
              value={reading}
              onChange={e => handleReadingChange(e.target.value)}
              placeholder={
                needsManualReading
                  ? t('dialog.reading_placeholder_manual')
                  : t('dialog.reading_placeholder_auto')
              }
              aria-invalid={missingRequiredReading}
              aria-describedby={missingRequiredReading ? 'reading-error' : undefined}
            />
            {missingRequiredReading ? (
              <p id="reading-error" className="text-xs text-destructive">
                {t('dialog.reading_error')}
              </p>
            ) : (
              needsManualReading && (
                <p className="text-xs text-muted-foreground">{t('dialog.reading_hint')}</p>
              )
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="romaji">{t('dialog.romaji')}</Label>
            <Input
              id="romaji"
              value={romaji}
              onChange={e => setRomaji(e.target.value)}
              placeholder={t('dialog.romaji_placeholder')}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={!isValid}>
              {isEditMode ? tc('update') : tc('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
