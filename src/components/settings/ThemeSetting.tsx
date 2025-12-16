import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SettingSection } from './SettingSection'
import { THEME_OPTIONS } from './settings-options'
import type { ThemeSettingProps } from './types'

export function ThemeSetting({ theme, onThemeChange }: ThemeSettingProps) {
  const { t } = useTranslation('settings')

  return (
    <SettingSection delay={0.5}>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">{t('theme.title')}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t('theme.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onThemeChange(option.value)}
                className={cn(
                  'relative p-4 rounded-lg border text-left transition-all',
                  'hover:bg-secondary/80',
                  theme === option.value
                    ? 'bg-primary/10 border-primary'
                    : 'bg-secondary/50 border-border/50'
                )}
              >
                <div className="font-medium">{t(option.labelKey)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t(option.descKey)}
                </div>
                {theme === option.value && (
                  <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground">
            {t('theme.note')}
          </p>
        </div>
      </Card>
    </SettingSection>
  )
}

