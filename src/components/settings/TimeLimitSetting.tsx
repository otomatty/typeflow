import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Gauge, ArrowRight, TrendingUp } from 'lucide-react'
import { SettingSection } from './SettingSection'
import type { TimeLimitSettingProps } from './types'

export function TimeLimitSetting({
  kpsStatus,
  targetKpsInfo,
  timeLimitExample,
  exampleKeystrokeCount,
}: TimeLimitSettingProps) {
  const { t } = useTranslation('settings')

  return (
    <SettingSection delay={0.3}>
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              <Label className="text-base font-semibold">{t('time_limit.title')}</Label>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('time_limit.description')}
            </p>
          </div>

          {/* Current → Target KPS Card */}
          <div className="p-5 rounded-xl bg-linear-to-r from-secondary/80 to-primary/10 border border-border/50">
            <div className="flex items-center justify-between gap-4">
              {/* Current KPS */}
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground mb-1">{t('time_limit.current')}</p>
                <p className="text-3xl font-bold tabular-nums">{kpsStatus.averageKps}</p>
                <p className="text-xs text-muted-foreground">{t('time_limit.keys_per_sec')}</p>
              </div>
              
              {/* Arrow */}
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="w-6 h-6 text-primary" />
                {targetKpsInfo.isFaster && targetKpsInfo.percentDiff > 0 && (
                  <div className="flex items-center gap-1 text-xs text-orange-500">
                    <TrendingUp className="w-3 h-3" />
                    <span>+{targetKpsInfo.percentDiff}%</span>
                  </div>
                )}
              </div>
              
              {/* Target KPS */}
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground mb-1">{t('time_limit.target')}</p>
                <p className="text-3xl font-bold tabular-nums text-primary">{targetKpsInfo.targetKps}</p>
                <p className="text-xs text-muted-foreground">{t('time_limit.keys_per_sec')}</p>
              </div>
            </div>
            
            {/* Confidence Bar */}
            {kpsStatus.confidence < 100 && (
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{kpsStatus.label}</span>
                  <span>{t('time_limit.games_played', { count: kpsStatus.gamesPlayed })}</span>
                </div>
                <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${kpsStatus.confidence}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Time Limit Example */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border/30">
            <p className="text-sm font-medium mb-2">{t('time_limit.example_title')}</p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('time_limit.example_word')} ({exampleKeystrokeCount}{t('time_limit.keystrokes')})
              </div>
              <div className="text-right">
                <span className="text-xl font-bold tabular-nums text-primary">{timeLimitExample}</span>
                <span className="text-sm text-muted-foreground ml-1">{t('time_limit.seconds')}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('time_limit.example_note')}
            </p>
          </div>

        </div>
      </Card>
    </SettingSection>
  )
}

