import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card } from '@/components/ui/card'
import { parseCSV, readCSVFile } from '@/lib/csv-utils'
import type { PresetWord } from '@/lib/types'
import { FileUp, Upload, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CSVImportDialogProps {
  onImport: (
    words: PresetWord[],
    options: { clearExisting: boolean; presetName: string }
  ) => Promise<void>
  /** 外部から制御する場合のopen状態 */
  open?: boolean
  /** 外部から制御する場合のonOpenChange */
  onOpenChange?: (open: boolean) => void
  /** トリガーボタンを表示するかどうか（デフォルト: true） */
  showTrigger?: boolean
}

export function CSVImportDialog({
  onImport,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: CSVImportDialogProps) {
  const { t, i18n } = useTranslation('words')

  const [internalOpen, setInternalOpen] = useState(false)

  // 制御モードかどうか
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpenInternal = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen
  const [isLoading, setIsLoading] = useState(false)
  const [clearExisting, setClearExisting] = useState(false)
  const [previewWords, setPreviewWords] = useState<PresetWord[]>([])
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isJa = i18n.language?.startsWith('ja')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setFileName(file.name)

    try {
      const csvText = await readCSVFile(file)
      const words = parseCSV(csvText)

      if (words.length === 0) {
        setError(
          isJa
            ? 'CSVファイルから単語を読み取れませんでした。形式を確認してください。'
            : 'Could not read words from CSV file. Please check the format.'
        )
        setPreviewWords([])
        return
      }

      setPreviewWords(words)
    } catch (err) {
      setError(isJa ? 'ファイルの読み込みに失敗しました' : 'Failed to read file')
      setPreviewWords([])
      console.error(err)
    }
  }

  const handleImport = async () => {
    if (previewWords.length === 0) {
      toast.error(isJa ? 'インポートする単語がありません' : 'No words to import')
      return
    }

    setIsLoading(true)
    try {
      await onImport(previewWords, {
        clearExisting,
        presetName: fileName.replace(/\.csv$/i, '') || (isJa ? 'CSVインポート' : 'CSV Import'),
      })
      setOpenInternal(false)
      resetState()
    } finally {
      setIsLoading(false)
    }
  }

  const resetState = () => {
    setPreviewWords([])
    setFileName('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpenInternal(newOpen)
    if (!newOpen) {
      resetState()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FileUp className="h-4 w-4" />
            {t('csv.import')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('csv.title')}</DialogTitle>
          <DialogDescription>
            {isJa
              ? 'CSVファイルから単語リストを読み込みます。形式: ワード,読み,ローマ字'
              : 'Load word list from CSV file. Format: word,reading,romaji'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ファイル選択 */}
          <div className="space-y-2">
            <Label>{isJa ? 'CSVファイルを選択' : 'Select CSV file'}</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {isJa
                ? '1行目がヘッダー（ワード,読み,入力例）の場合は自動的にスキップされます'
                : 'Header row (word,reading,romaji) will be automatically skipped'}
            </p>
          </div>

          {/* エラー表示 */}
          {error && (
            <Card className="p-3 border-destructive bg-destructive/10">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </Card>
          )}

          {/* プレビュー */}
          {previewWords.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{isJa ? 'プレビュー' : 'Preview'}</Label>
                <span className="text-sm text-muted-foreground">
                  {t('n_words', { count: previewWords.length })}
                </span>
              </div>
              <Card className="p-3 max-h-48 overflow-y-auto">
                <div className="space-y-1">
                  {previewWords.slice(0, 10).map((word, i) => (
                    <div key={i} className="text-sm grid grid-cols-3 gap-2">
                      <span className="truncate">{word.text}</span>
                      <span className="truncate text-muted-foreground">{word.reading}</span>
                      <span className="truncate text-muted-foreground font-mono text-xs">
                        {word.romaji}
                      </span>
                    </div>
                  ))}
                  {previewWords.length > 10 && (
                    <p className="text-xs text-muted-foreground pt-2">
                      {isJa
                        ? `...他 ${previewWords.length - 10} 語`
                        : `...and ${previewWords.length - 10} more`}
                    </p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* オプション */}
          <div className="flex items-center space-x-2 py-2 border-t">
            <Switch
              id="clear-existing-csv"
              checked={clearExisting}
              onCheckedChange={setClearExisting}
            />
            <Label htmlFor="clear-existing-csv" className="text-sm text-muted-foreground">
              {t('preset_clear_existing')}
            </Label>
          </div>

          {/* インポートボタン */}
          <Button
            onClick={handleImport}
            disabled={previewWords.length === 0 || isLoading}
            className="w-full gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {previewWords.length > 0
              ? isJa
                ? `${previewWords.length}語をインポート`
                : `Import ${previewWords.length} words`
              : isJa
                ? 'ファイルを選択してください'
                : 'Select a file'}
          </Button>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground">
            💡 {isJa ? 'CSV形式の例:' : 'CSV format example:'}
            <br />
            <code className="text-xs bg-muted px-1 rounded">
              {isJa ? 'ワード,読み,入力例' : 'word,reading,romaji'}
            </code>
            <br />
            <code className="text-xs bg-muted px-1 rounded">ありがとう,ありがとう,arigatou</code>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
