import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { SettingSection } from './SettingSection'
import { MIN_WORD_COUNT, MAX_WORD_COUNT, STEP } from './settings-options'
import type { WordCountSettingProps } from './types'
import type { WordCountPreset } from '@/lib/types'

export function WordCountSetting({ wordCount, onWordCountChange }: WordCountSettingProps) {
  const { t } = useTranslation('settings')
  
  const isAllWords = wordCount === 'all'
  const sliderValue = typeof wordCount === 'number' ? wordCount : 20

  const handleSliderChange = (values: number[]) => {
    if (!isAllWords && values[0] !== undefined) {
      onWordCountChange(values[0] as WordCountPreset)
    }
  }

  const handleAllWordsToggle = (checked: boolean) => {
    if (checked) {
      onWordCountChange('all')
    } else {
      onWordCountChange(sliderValue as WordCountPreset)
    }
  }

  return (
    <SettingSection delay={0.1}>
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold">{t('word_count.title')}</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t('word_count.description')}
            </p>
          </div>

          {/* All Words Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="all-words" className="text-sm font-medium">
                {t('word_count.use_all')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('word_count.use_all_description')}
              </p>
            </div>
            <Switch
              id="all-words"
              checked={isAllWords}
              onCheckedChange={handleAllWordsToggle}
            />
          </div>

          {/* Slider */}
          <div className={cn(
            'space-y-4 transition-opacity',
            isAllWords && 'opacity-50 pointer-events-none'
          )}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('word_count.select')}</span>
              <span className="text-2xl font-bold tabular-nums">
                {sliderValue}
                <span className="text-sm font-normal text-muted-foreground ml-1">{t('word_count.questions')}</span>
              </span>
            </div>
            
            <Slider
              value={[sliderValue]}
              onValueChange={handleSliderChange}
              min={MIN_WORD_COUNT}
              max={MAX_WORD_COUNT}
              step={STEP}
              disabled={isAllWords}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{MIN_WORD_COUNT} {t('word_count.questions')}</span>
              <span>{MAX_WORD_COUNT} {t('word_count.questions')}</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {t('word_count.note')}
          </p>
        </div>
      </Card>
    </SettingSection>
  )
}

