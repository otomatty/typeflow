import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SettingSection } from './SettingSection'
import { PRACTICE_MODE_OPTIONS } from './settings-options'
import type { PracticeModeSettingProps } from './types'

export function PracticeModeSetting({ practiceMode, onPracticeModeChange }: PracticeModeSettingProps) {
  const { t } = useTranslation('settings')

  return (
    <SettingSection delay={0.25}>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">{t('practice_mode.title')}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t('practice_mode.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRACTICE_MODE_OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => onPracticeModeChange(option.value)}
                  className={cn(
                    'relative p-4 rounded-lg border text-left transition-all',
                    'hover:bg-secondary/80',
                    practiceMode === option.value
                      ? 'bg-primary/10 border-primary'
                      : 'bg-secondary/50 border-border/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{t(option.labelKey)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t(option.descKey)}
                  </div>
                  {practiceMode === option.value && (
                    <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </Card>
    </SettingSection>
  )
}

