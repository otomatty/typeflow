import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Check, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SettingSection } from './SettingSection'
import { DIFFICULTY_OPTIONS } from './settings-options'
import type { DifficultyPresetSettingProps } from './types'

export function DifficultyPresetSetting({
  difficultyPreset,
  onDifficultyPresetChange,
  currentDifficultyParams,
  penaltyPreview,
}: DifficultyPresetSettingProps) {
  const { t } = useTranslation('settings')

  return (
    <SettingSection delay={0.2}>
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              <Label className="text-base font-semibold">{t('difficulty.title')}</Label>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('difficulty.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DIFFICULTY_OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => onDifficultyPresetChange(option.value)}
                  className={cn(
                    'relative p-4 rounded-lg border text-left transition-all',
                    'hover:bg-secondary/80',
                    difficultyPreset === option.value
                      ? 'bg-primary/10 border-primary'
                      : 'bg-secondary/50 border-border/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-5 h-5', option.color)} />
                    <span className="font-medium text-sm">{t(option.labelKey)}</span>
                  </div>
                  {difficultyPreset === option.value && (
                    <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Penalty Preview */}
          {currentDifficultyParams.missPenaltyEnabled && (
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-sm font-medium mb-2">{t('penalty.title')}</p>
              <div className="flex items-center gap-2 text-xs">
                {penaltyPreview.map((percent, index) => (
                  <span key={index} className={cn(
                    'px-2 py-1 rounded',
                    index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                    index === 1 ? 'bg-orange-500/20 text-orange-600' :
                    index === 2 ? 'bg-red-500/20 text-red-600' :
                    'bg-red-600/20 text-red-700'
                  )}>
                    {t('penalty.time_nth', { n: index + 1, percent })}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </Card>
    </SettingSection>
  )
}

