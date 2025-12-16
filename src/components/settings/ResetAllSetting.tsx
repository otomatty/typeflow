import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { ResetAllDialog } from '@/components/ResetSettingsDialog'
import { SettingSection } from './SettingSection'
import type { ResetAllSettingProps } from './types'

export function ResetAllSetting({ onResetAll }: ResetAllSettingProps) {
  const { t } = useTranslation('settings')
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  return (
    <>
      <SettingSection delay={0.6}>
        <Card className="p-6 border-destructive/20">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-destructive" />
                <Label className="text-base font-semibold text-destructive">{t('reset_all.title')}</Label>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('reset_all.description')}
              </p>
            </div>
            
            <Button
              variant="destructive"
              onClick={() => setResetDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('reset_all.button')}
            </Button>
          </div>
        </Card>
      </SettingSection>

      <ResetAllDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        onReset={onResetAll}
      />
    </>
  )
}

