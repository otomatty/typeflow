import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RotateCcw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface ResetAllDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReset: () => Promise<void>
}

export function ResetAllDialog({ open, onOpenChange, onReset }: ResetAllDialogProps) {
  const { t } = useTranslation('settings')
  const [isResetting, setIsResetting] = useState(false)

  const handleReset = async () => {
    setIsResetting(true)
    try {
      await onReset()
      onOpenChange(false)
      toast.success(t('reset_all.success'))
    } catch (error) {
      console.error('Failed to reset all data:', error)
      toast.error(t('reset_all.error'))
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle>{t('reset_all.title')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {t('reset_all.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>{t('reset_all.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={isResetting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isResetting ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                {t('reset_all.resetting')}
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('reset_all.confirm')}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
