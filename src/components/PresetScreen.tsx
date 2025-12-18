import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScreenHeader } from '@/components/ScreenHeader'
import { usePresets } from '@/hooks/usePresets'
import type { WordPreset, PresetWord } from '@/lib/types'
import { Download, Package, Loader2, ArrowLeft } from 'lucide-react'

interface PresetScreenProps {
  onLoadPreset: (
    words: PresetWord[],
    options: { clearExisting: boolean; presetName: string }
  ) => Promise<void>
  onNavigate: (view: 'menu') => void
  isLoading?: boolean
  /** クイックスタート後の選択かどうか */
  isAfterQuickStart?: boolean
}

export function PresetScreen({
  onLoadPreset,
  onNavigate,
  isLoading,
  isAfterQuickStart = false,
}: PresetScreenProps) {
  const { t } = useTranslation('words')
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [clearExisting, setClearExisting] = useState(false)
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null)
  const { presets: allPresets, isLoading: presetsLoading, getPresetById } = usePresets()

  const difficultyColors: Record<WordPreset['difficulty'], string> = {
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    normal: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const getDifficultyLabel = (difficulty: WordPreset['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return t('difficulty_beginner')
      case 'normal':
        return t('difficulty_intermediate')
      case 'hard':
        return t('difficulty_advanced')
    }
  }

  const handleLoadPreset = async (presetId: string) => {
    try {
      const preset = await getPresetById(presetId)
      if (!preset) {
        console.error(`Preset not found: ${presetId}`)
        return
      }

      setLoadingPresetId(presetId)
      try {
        await onLoadPreset(preset.words, {
          clearExisting: isAfterQuickStart ? true : clearExisting, // クイックスタート後は常に既存を削除
          presetName: preset.name,
        })
        // プリセット読み込み後、メニューに戻る
        onNavigate('menu')
      } finally {
        setLoadingPresetId(null)
      }
    } catch (error) {
      console.error('Failed to load preset:', error)
      setLoadingPresetId(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ScreenHeader
          title={t('preset_title')}
          description={t('preset_desc')}
          action={
            <Button variant="ghost" size="sm" onClick={() => onNavigate('menu')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('back_to_menu', { defaultValue: 'メニューに戻る' })}
            </Button>
          }
        />

        {/* クイックスタート後の説明 */}
        {isAfterQuickStart && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg"
          >
            <p className="text-sm text-muted-foreground">{t('preset_after_quickstart')}</p>
          </motion.div>
        )}

        {/* 既存データをクリアするオプション */}
        {!isAfterQuickStart && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-6 flex items-center space-x-2 p-4 bg-muted/50 rounded-lg border"
          >
            <Switch
              id="clear-existing"
              checked={clearExisting}
              onCheckedChange={setClearExisting}
            />
            <Label htmlFor="clear-existing" className="text-sm cursor-pointer">
              {t('preset_clear_existing')}
            </Label>
          </motion.div>
        )}

        {/* プリセット一覧 */}
        <div className="mt-8 space-y-4">
          {presetsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">
                {t('loading', { defaultValue: '読み込み中...' })}
              </span>
            </div>
          ) : allPresets.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {t('no_presets', { defaultValue: 'プリセットが見つかりません' })}
              </p>
            </Card>
          ) : (
            allPresets.map((preset, index) => (
              <motion.div
                key={preset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className={`p-6 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                    selectedPresetId === preset.id ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}
                  onClick={() => setSelectedPresetId(preset.id)}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{preset.name}</h3>
                        <Badge variant="outline" className={difficultyColors[preset.difficulty]}>
                          {getDifficultyLabel(preset.difficulty)}
                        </Badge>
                        <Badge variant="secondary" className="font-medium">
                          {t('n_words', { count: preset.wordCount })}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{preset.description}</p>

                      {/* サンプル単語プレビュー */}
                      <div className="flex flex-wrap gap-2">
                        {preset.words.slice(0, 8).map((word, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 bg-muted rounded-md border border-border/50"
                          >
                            {word.text}
                          </span>
                        ))}
                        {preset.words.length > 8 && (
                          <span className="text-xs px-2.5 py-1 text-muted-foreground">
                            +{t('n_words', { count: preset.words.length - 8 })}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="lg"
                      onClick={e => {
                        e.stopPropagation()
                        handleLoadPreset(preset.id)
                      }}
                      disabled={loadingPresetId !== null || isLoading}
                      className="shrink-0 gap-2"
                    >
                      {loadingPresetId === preset.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('loading', { defaultValue: '読み込み中...' })}
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          {t('preset_load')}
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* ヒント */}
        {allPresets.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mt-8 p-4 bg-muted/30 rounded-lg border border-border/50"
          >
            <p className="text-xs text-muted-foreground">{t('preset_hint')}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
