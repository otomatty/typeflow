import { useTranslation } from 'react-i18next'
import { Alert, AlertTitle, AlertDescription } from './components/ui/alert'
import { Button } from './components/ui/button'

import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react'

export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const { t } = useTranslation('common')

  // When encountering an error in the development mode, rethrow it and don't display the boundary.
  // The parent UI will take care of showing a more helpful dialog.
  if (import.meta.env.DEV) throw error

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon aria-hidden="true" />
          <AlertTitle>{t('errorBoundary.title')}</AlertTitle>
          <AlertDescription>{t('errorBoundary.description')}</AlertDescription>
        </Alert>

        <div className="bg-card border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">
            {t('errorBoundary.detailsLabel')}
          </h3>
          <pre className="text-xs text-destructive bg-muted/50 p-3 rounded border overflow-auto max-h-32">
            {error.message}
          </pre>
        </div>

        <Button onClick={resetErrorBoundary} className="w-full" variant="outline">
          <RefreshCwIcon aria-hidden="true" />
          {t('errorBoundary.retry')}
        </Button>
      </div>
    </div>
  )
}
