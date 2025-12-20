import { useState } from 'react'
import { useSignIn } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Github, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export function AuthScreen() {
  const { t } = useTranslation()
  const { signIn, setActive, isLoaded } = useSignIn()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailMode, setIsEmailMode] = useState(false)

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    setIsLoading(true)
    try {
      // メールアドレスでサインインを試みる（アカウントが存在しない場合は自動的に作成される）
      const result = await signIn.create({
        identifier: email,
        password: password || undefined, // パスワードが空の場合はundefined（パスワードレス認証）
      })

      // 認証が完了したらセッションをアクティブにする
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
      } else {
        // 追加の認証ステップが必要な場合（例: パスワード設定、メール確認など）
        toast.info(t('auth.additionalSteps', { defaultValue: '追加の認証ステップが必要です' }))
      }
    } catch (error: unknown) {
      console.error('Sign in error:', error)
      const errorMessage =
        (error as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message ||
        t('auth.signInError', { defaultValue: 'ログインに失敗しました' })
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuth = async (strategy: 'oauth_google' | 'oauth_github') => {
    if (!isLoaded || !signIn) return

    setIsLoading(true)
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        // ClerkがOAuthコールバックを処理するためのURL
        // Clerkがセッションを作成した後、redirectUrlCompleteにリダイレクトされる
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      })
    } catch (error: unknown) {
      console.error('OAuth error:', error)
      const errorMessage =
        (error as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message ||
        t('auth.oauthError', { defaultValue: '認証に失敗しました' })
      toast.error(errorMessage)
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">{t('loading', { defaultValue: '読み込み中...' })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">TypeFlow</h1>
          <p className="text-muted-foreground">
            {t('auth.welcome', { defaultValue: 'ログインしてタイピング練習を始めましょう' })}
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          {!isEmailMode ? (
            <>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuth('oauth_google')}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {t('auth.signInWithGoogle', { defaultValue: 'Googleでログイン' })}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuth('oauth_github')}
                  disabled={isLoading}
                >
                  <Github className="mr-2 h-4 w-4" />
                  {t('auth.signInWithGithub', { defaultValue: 'GitHubでログイン' })}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      {t('auth.or', { defaultValue: 'または' })}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsEmailMode(true)}
                  disabled={isLoading}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {t('auth.signInWithEmail', { defaultValue: 'メールアドレスでログイン' })}
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email', { defaultValue: 'メールアドレス' })}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {t('auth.password', { defaultValue: 'パスワード' })}
                  <span className="text-muted-foreground text-xs ml-2">
                    ({t('auth.optional', { defaultValue: '任意' })})
                  </span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.passwordPlaceholder', {
                    defaultValue: 'パスワード（初回は空欄可）',
                  })}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  {t('auth.passwordHint', {
                    defaultValue:
                      '初回ログイン時はパスワードを空欄にできます。アカウントが自動的に作成されます。',
                  })}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setIsEmailMode(false)
                    setEmail('')
                    setPassword('')
                  }}
                  disabled={isLoading}
                >
                  {t('back', { defaultValue: '戻る' })}
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading
                    ? t('loading', { defaultValue: '読み込み中...' })
                    : t('auth.signIn', { defaultValue: 'ログイン' })}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
