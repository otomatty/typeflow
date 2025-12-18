import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Container } from '@/components/Container'
import { ScreenHeader } from '@/components/ScreenHeader'
import { usePresets } from '@/hooks/usePresets'
import { useUserPresets } from '@/hooks/useUserPresets'
import type { WordPreset, PresetWord } from '@/lib/types'
import type { UserPresetWord } from '@/lib/db'
import { Download, Package, Loader2, Trash2, User } from 'lucide-react'
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

interface PresetScreenProps {
  onLoadPreset: (
    words: PresetWord[],
    options: { clearExisting: boolean; presetName: string }
  ) => Promise<void>
  onLoadUserPreset: (
    words: UserPresetWord[],
    options: { clearExisting: boolean; presetName: string }
  ) => Promise<void>
  onNavigate: (view: 'menu') => void
  isLoading?: boolean
  /** クイックスタート後の選択かどうか */
  isAfterQuickStart?: boolean
}

export function PresetScreen({
  onLoadPreset,
  onLoadUserPreset,
  onNavigate,
  isLoading,
  isAfterQuickStart = false,
}: PresetScreenProps) {
  const { t } = useTranslation('words')
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null)
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { presets: allPresets, isLoading: presetsLoading, getPresetById } = usePresets()
  const { presets: userPresets, getPresetById: getUserPresetById, removePreset } = useUserPresets()

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
        // 推奨プリセットは既存の単語に追加（クイックスタート後のみ既存を削除）
        await onLoadPreset(preset.words, {
          clearExisting: isAfterQuickStart ? true : false,
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

  const handleLoadUserPreset = async (presetId: string) => {
    try {
      const preset = await getUserPresetById(presetId)
      if (!preset) {
        console.error(`User preset not found: ${presetId}`)
        return
      }

      setLoadingPresetId(presetId)
      try {
        // ユーザープリセットは統計データも含まれているため、既存の単語を削除しない
        // クイックスタート後のみ既存を削除
        await onLoadUserPreset(preset.words, {
          clearExisting: isAfterQuickStart ? true : false,
          presetName: preset.name,
        })
        onNavigate('menu')
      } finally {
        setLoadingPresetId(null)
      }
    } catch (error) {
      console.error('Failed to load user preset:', error)
      setLoadingPresetId(null)
    }
  }

  const handleDeleteUserPreset = async (presetId: string) => {
    setDeletingPresetId(presetId)
    try {
      await removePreset(presetId)
      setDeleteDialogOpen(false)
    } finally {
      setDeletingPresetId(null)
    }
  }

  return (
    <Container>
      <ScreenHeader title={t('preset_title')} description={t('preset_desc')} />

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

      {/* プリセット読み込みの説明 */}
      {!isAfterQuickStart && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-6 p-4 bg-muted/50 rounded-lg border"
        >
          <p className="text-sm text-muted-foreground">
            {t('preset_load_info', {
              defaultValue:
                'プリセットを読み込むと、既存の単語に追加されます。統計データは保持されます。',
            })}
          </p>
        </motion.div>
      )}

      {/* ユーザープリセットセクション */}
      {userPresets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {t('user_presets', { defaultValue: '保存したプリセット' })}
            </h2>
          </div>
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {t('user_preset_info', {
                defaultValue:
                  '保存したプリセットには統計データも含まれています。読み込むと既存の単語に追加され、統計データも復元されます。',
              })}
            </p>
          </div>
          <div className="space-y-4">
            {userPresets.map((preset, index) => (
              <motion.div
                key={preset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
              >
                <Card className="p-6 transition-all hover:border-primary/50 hover:shadow-md">
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
                      {preset.description && (
                        <p className="text-sm text-muted-foreground mb-4">{preset.description}</p>
                      )}

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

                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="lg"
                        onClick={() => handleLoadUserPreset(preset.id)}
                        disabled={loadingPresetId !== null || isLoading}
                        className="gap-2"
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
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => {
                          setDeletingPresetId(preset.id)
                          setDeleteDialogOpen(true)
                        }}
                        disabled={deletingPresetId !== null}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 推奨プリセットセクション */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: userPresets.length > 0 ? 0.3 : 0.2 }}
        className={userPresets.length > 0 ? 'mt-12' : 'mt-8'}
      >
        {userPresets.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {t('recommended_presets', { defaultValue: '推奨プリセット' })}
            </h2>
          </div>
        )}
        <div className="space-y-4">
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
                transition={{
                  duration: 0.3,
                  delay: (userPresets.length > 0 ? 0.35 : 0.25) + index * 0.05,
                }}
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
      </motion.div>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('delete_preset_confirm', { defaultValue: 'プリセットを削除しますか？' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_preset_description', {
                defaultValue:
                  'この操作は取り消せません。プリセットとその統計データが削除されます。',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel', { defaultValue: 'キャンセル' })}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingPresetId) {
                  handleDeleteUserPreset(deletingPresetId)
                }
              }}
              disabled={deletingPresetId === null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete', { defaultValue: '削除' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </Container>
  )
}
