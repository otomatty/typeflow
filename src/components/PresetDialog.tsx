import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { allPresets, getPresetById } from '@/lib/presets'
import type { WordPreset, PresetWord } from '@/lib/types'
import { Download, Package, Loader2 } from 'lucide-react'

interface PresetDialogProps {
  onLoadPreset: (words: PresetWord[], options: { clearExisting: boolean; presetName: string }) => Promise<void>
  isLoading?: boolean
  /** 外部から制御する場合のopen状態 */
  open?: boolean
  /** 外部から制御する場合のonOpenChange */
  onOpenChange?: (open: boolean) => void
  /** トリガーボタンを表示するかどうか（デフォルト: true） */
  showTrigger?: boolean
}

export function PresetDialog({ onLoadPreset, isLoading, open: controlledOpen, onOpenChange, showTrigger = true }: PresetDialogProps) {
  const { t } = useTranslation('words')
  
  const [internalOpen, setInternalOpen] = useState(false)
  
  // 制御モードかどうか
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [clearExisting, setClearExisting] = useState(false)
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null)

  const difficultyColors: Record<WordPreset['difficulty'], string> = {
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    normal: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const getDifficultyLabel = (difficulty: WordPreset['difficulty']) => {
    switch (difficulty) {
      case 'easy': return t('difficulty_beginner')
      case 'normal': return t('difficulty_intermediate')
      case 'hard': return t('difficulty_advanced')
    }
  }

  const handleLoadPreset = async (presetId: string) => {
    const preset = getPresetById(presetId)
    if (!preset) return

    setLoadingPresetId(presetId)
    try {
      await onLoadPreset(preset.words, {
        clearExisting,
        presetName: preset.name,
      })
      setOpen(false)
      setSelectedPresetId(null)
    } finally {
      setLoadingPresetId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Package className="h-4 w-4" />
            {t('preset')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('preset_title')}</DialogTitle>
          <DialogDescription>
            {t('preset_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-4 border-b">
          <Switch
            id="clear-existing"
            checked={clearExisting}
            onCheckedChange={setClearExisting}
          />
          <Label htmlFor="clear-existing" className="text-sm text-muted-foreground">
            {t('preset_clear_existing')}
          </Label>
        </div>

        <div className="grid gap-4 py-4">
          {allPresets.map((preset) => (
            <Card
              key={preset.id}
              className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
                selectedPresetId === preset.id ? 'border-primary ring-1 ring-primary' : ''
              }`}
              onClick={() => setSelectedPresetId(preset.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{preset.name}</h3>
                    <Badge variant="outline" className={difficultyColors[preset.difficulty]}>
                      {getDifficultyLabel(preset.difficulty)}
                    </Badge>
                    <Badge variant="secondary">{t('n_words', { count: preset.wordCount })}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{preset.description}</p>
                  
                  {/* サンプル単語プレビュー */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {preset.words.slice(0, 5).map((word, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-muted rounded"
                      >
                        {word.text}
                      </span>
                    ))}
                    {preset.words.length > 5 && (
                      <span className="text-xs px-2 py-0.5 text-muted-foreground">
                        +{t('n_words', { count: preset.words.length - 5 })}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLoadPreset(preset.id)
                  }}
                  disabled={loadingPresetId !== null || isLoading}
                  className="shrink-0"
                >
                  {loadingPresetId === preset.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" />
                      {t('preset_load')}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {t('preset_hint')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
