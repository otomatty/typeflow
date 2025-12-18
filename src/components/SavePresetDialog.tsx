import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Word } from '@/lib/types'

interface SavePresetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  words: Word[]
  onSave: (
    name: string,
    description: string,
    difficulty: 'easy' | 'normal' | 'hard'
  ) => Promise<void>
}

export function SavePresetDialog({ open, onOpenChange, words, onSave }: SavePresetDialogProps) {
  const { t } = useTranslation('words')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      return
    }

    setIsSaving(true)
    try {
      await onSave(name.trim(), description.trim(), difficulty)
      // フォームをリセット
      setName('')
      setDescription('')
      setDifficulty('normal')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save preset:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('save_preset_title', { defaultValue: 'プリセットを保存' })}</DialogTitle>
          <DialogDescription>
            {t('save_preset_description', {
              defaultValue: '現在の単語リストと統計データをプリセットとして保存します。',
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="preset-name">
              {t('preset_name', { defaultValue: 'プリセット名' })}
            </Label>
            <Input
              id="preset-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('preset_name_placeholder', { defaultValue: '例: 私の練習セット' })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preset-description">
              {t('preset_description', { defaultValue: '説明（任意）' })}
            </Label>
            <Textarea
              id="preset-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('preset_description_placeholder', {
                defaultValue: 'このプリセットの説明を入力してください',
              })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preset-difficulty">
              {t('preset_difficulty', { defaultValue: '難易度' })}
            </Label>
            <Select
              value={difficulty}
              onValueChange={value => setDifficulty(value as 'easy' | 'normal' | 'hard')}
            >
              <SelectTrigger id="preset-difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">
                  {t('difficulty_beginner', { defaultValue: '初級' })}
                </SelectItem>
                <SelectItem value="normal">
                  {t('difficulty_intermediate', { defaultValue: '中級' })}
                </SelectItem>
                <SelectItem value="hard">
                  {t('difficulty_advanced', { defaultValue: '上級' })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {t('n_words', { count: words.length })}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t('cancel', { defaultValue: 'キャンセル' })}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving
              ? t('saving', { defaultValue: '保存中...' })
              : t('save', { defaultValue: '保存' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
