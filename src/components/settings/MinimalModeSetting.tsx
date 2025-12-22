import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SettingSection } from './SettingSection'
import { MINIMAL_MODE_OPTIONS } from './settings-options'
import type { MinimalModeSettingProps } from './types'

export function MinimalModeSetting({
  minimalMode,
  minimalModeBreakpoint,
  onMinimalModeChange,
  onMinimalModeBreakpointChange,
}: MinimalModeSettingProps) {
  const { t } = useTranslation('settings')

  return (
    <SettingSection delay={0.55}>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">{t('minimal_mode.title')}</Label>
            <p className="text-sm text-muted-foreground mt-1">{t('minimal_mode.description')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MINIMAL_MODE_OPTIONS.map(option => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => onMinimalModeChange(option.value)}
                  className={cn(
                    'relative p-4 rounded-lg border text-left transition-all',
                    'hover:bg-secondary/80',
                    minimalMode === option.value
                      ? 'bg-primary/10 border-primary'
                      : 'bg-secondary/50 border-border/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{t(option.labelKey)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{t(option.descKey)}</div>
                  {minimalMode === option.value && (
                    <Check className="absolute top-2 right-2 w-5 h-5 text-primary" />
                  )}
                </button>
              )
            })}
          </div>

          {/* ブレークポイント設定（autoモードの場合のみ表示） */}
          {minimalMode === 'auto' && (
            <div className="space-y-3 pt-2 border-t border-border/30">
              <div>
                <Label className="text-sm font-medium">{t('minimal_mode.breakpoint')}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('minimal_mode.breakpoint_desc')}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Slider
                  value={[minimalModeBreakpoint]}
                  onValueChange={([value]) => onMinimalModeBreakpointChange(value)}
                  min={300}
                  max={1200}
                  step={50}
                  className="flex-1"
                />
                <div className="text-sm font-mono text-muted-foreground min-w-[4rem] text-right">
                  {minimalModeBreakpoint}
                  {t('minimal_mode.pixels')}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </SettingSection>
  )
}
