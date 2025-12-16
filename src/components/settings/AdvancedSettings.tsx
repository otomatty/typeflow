import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SettingSection } from './SettingSection'
import type { AdvancedSettingsProps } from './types'

export function AdvancedSettings({
  srsEnabled,
  warmupEnabled,
  onSrsEnabledChange,
  onWarmupEnabledChange,
}: AdvancedSettingsProps) {
  const { t } = useTranslation('settings')

  return (
    <SettingSection delay={0.4}>
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold">{t('advanced.title')}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t('advanced.description')}
            </p>
          </div>

          {/* SRS Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="srs-enabled" className="text-sm font-medium">
                {t('advanced.srs')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('advanced.srs_desc')}
              </p>
            </div>
            <Switch
              id="srs-enabled"
              checked={srsEnabled}
              onCheckedChange={onSrsEnabledChange}
            />
          </div>

          {/* Warmup Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="warmup-enabled" className="text-sm font-medium">
                {t('advanced.warmup')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('advanced.warmup_desc')}
              </p>
            </div>
            <Switch
              id="warmup-enabled"
              checked={warmupEnabled}
              onCheckedChange={onWarmupEnabledChange}
            />
          </div>
        </div>
      </Card>
    </SettingSection>
  )
}

