import { useState } from 'react'
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
}

const difficultyColors: Record<WordPreset['difficulty'], string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/30',
  normal: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const difficultyLabels: Record<WordPreset['difficulty'], string> = {
  easy: '初級',
  normal: '中級',
  hard: '上級',
}

export function PresetDialog({ onLoadPreset, isLoading }: PresetDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [clearExisting, setClearExisting] = useState(false)
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null)

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
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Package className="h-4 w-4" />
          プリセット
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>プリセットを読み込む</DialogTitle>
          <DialogDescription>
            あらかじめ用意された単語リストを読み込んで練習を開始できます
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-4 border-b">
          <Switch
            id="clear-existing"
            checked={clearExisting}
            onCheckedChange={setClearExisting}
          />
          <Label htmlFor="clear-existing" className="text-sm text-muted-foreground">
            既存の単語を削除してから読み込む
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
                      {difficultyLabels[preset.difficulty]}
                    </Badge>
                    <Badge variant="secondary">{preset.wordCount}語</Badge>
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
                        +{preset.words.length - 5}語
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
                      読み込む
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground">
            💡 ヒント: 寿司打など外部サイトの単語リストをインポートする機能は近日追加予定です
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

