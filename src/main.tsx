import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import { ClerkProvider } from '@clerk/clerk-react'
import '@github/spark/spark'

// i18n初期化（最初にインポート）
import './i18n'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import './main.css'
import './styles/theme.css'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// ビルド時には環境変数が設定されていない場合があるため、警告のみ表示
if (!PUBLISHABLE_KEY) {
  console.warn('⚠️ VITE_CLERK_PUBLISHABLE_KEY is not set. Clerk authentication will not work.')
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Configuration Error</h1>
        <p>
          VITE_CLERK_PUBLISHABLE_KEY is not configured. Please set it in your environment variables.
        </p>
      </div>
    )}
  </ErrorBoundary>
)
