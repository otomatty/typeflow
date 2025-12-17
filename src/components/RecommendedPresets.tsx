import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Download, Loader2 } from 'lucide-react'
import { allPresets, getPresetById } from '@/lib/presets'
import type { PresetWord } from '@/lib/types'

interface RecommendedPresetsProps {
  onLoadPreset: (
    words: PresetWord[],
    options: { clearExisting: boolean; presetName: string }
  ) => Promise<void>
  isLoading?: boolean
}

export function RecommendedPresets({ onLoadPreset, isLoading }: RecommendedPresetsProps) {
  const { t: tMenu } = useTranslation('menu')
  const { t: tWords } = useTranslation('words')
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null)

  // おすすめプリセット（基本日本語、プログラミング用語、寿司打）
  const recommendedPresets = allPresets.filter(
    p => p.id === 'basic-japanese' || p.id === 'programming' || p.id === 'sushida-10000'
  )

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    normal: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return tWords('difficulty_beginner')
      case 'normal':
        return tWords('difficulty_intermediate')
      case 'hard':
        return tWords('difficulty_advanced')
      default:
        return difficulty
    }
  }

  const handleLoadPreset = async (presetId: string) => {
    const preset = getPresetById(presetId)
    if (!preset) return

    setLoadingPresetId(presetId)
    try {
      await onLoadPreset(preset.words, {
        clearExisting: false,
        presetName: preset.name,
      })
    } finally {
      setLoadingPresetId(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="w-full max-w-2xl"
    >
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">{tMenu('recommended_presets_title')}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {tMenu('recommended_presets_description')}
          </p>

          <div className="grid gap-3">
            {recommendedPresets.map(preset => (
              <Card key={preset.id} className="p-4 hover:border-primary/50 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{preset.name}</h3>
                      <Badge variant="outline" className={difficultyColors[preset.difficulty]}>
                        {getDifficultyLabel(preset.difficulty)}
                      </Badge>
                      <Badge variant="secondary">
                        {tWords('n_words', { count: preset.wordCount })}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{preset.description}</p>

                    {/* サンプル単語プレビュー */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {preset.words.slice(0, 5).map((word, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-muted rounded">
                          {word.text}
                        </span>
                      ))}
                      {preset.words.length > 5 && (
                        <span className="text-xs px-2 py-0.5 text-muted-foreground">
                          +{tWords('n_words', { count: preset.words.length - 5 })}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleLoadPreset(preset.id)}
                    disabled={loadingPresetId !== null || isLoading}
                    className="shrink-0"
                  >
                    {loadingPresetId === preset.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" />
                        {tWords('preset_load')}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
