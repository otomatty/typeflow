import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Check, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SettingSection } from './SettingSection'
import type { LanguageSettingProps } from './types'

export function LanguageSetting({ currentLanguage, onLanguageChange }: LanguageSettingProps) {
  const { t } = useTranslation('settings')

  return (
    <SettingSection delay={0.05}>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <Label className="text-base font-semibold">{t('language.title')}</Label>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{t('language.description')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onLanguageChange('ja')}
              className={cn(
                'relative p-4 rounded-lg border text-left transition-all',
                'hover:bg-secondary/80',
                currentLanguage === 'ja'
                  ? 'bg-primary/10 border-primary'
                  : 'bg-secondary/50 border-border/50'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇯🇵</span>
                <span className="font-medium">日本語</span>
              </div>
              {currentLanguage === 'ja' && (
                <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
              )}
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={cn(
                'relative p-4 rounded-lg border text-left transition-all',
                'hover:bg-secondary/80',
                currentLanguage === 'en'
                  ? 'bg-primary/10 border-primary'
                  : 'bg-secondary/50 border-border/50'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇺🇸</span>
                <span className="font-medium">English</span>
              </div>
              {currentLanguage === 'en' && (
                <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
              )}
            </button>
          </div>
        </div>
      </Card>
    </SettingSection>
  )
}
