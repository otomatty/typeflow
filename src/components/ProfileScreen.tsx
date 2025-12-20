import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { ViewType } from '@/hooks/useGame'

interface ProfileScreenProps {
  onNavigate: (view: ViewType) => void
}

export function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  const { t } = useTranslation()
  const { user, isLoaded } = useUser()

  const [name, setName] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // ユーザー情報が読み込まれたら名前を設定
  useEffect(() => {
    if (user) {
      setName(user.fullName || user.firstName || '')
    }
  }, [user])

  if (!isLoaded || !user) {
    return (
      <>
        <Header currentView="profile" onNavigate={onNavigate} />
        <div className="pt-14 min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">
              {t('loading', { defaultValue: '読み込み中...' })}
            </p>
          </div>
        </div>
      </>
    )
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsUpdating(true)
    try {
      // Clerkのユーザー名を更新（フルネームとして保存）
      await user.update({
        firstName: name,
        lastName: '', // 姓は空にして、名前にフルネームを保存
      })

      toast.success(t('profile.updateSuccess', { defaultValue: 'プロフィールを更新しました' }))
    } catch (error: unknown) {
      console.error('Update error:', error)
      const errorMessage =
        (error as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message ||
        t('profile.updateError', { defaultValue: 'プロフィールの更新に失敗しました' })
      toast.error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  const displayName =
    user.fullName ||
    user.firstName ||
    user.username ||
    user.emailAddresses[0]?.emailAddress ||
    'User'
  const initials =
    displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'

  return (
    <>
      <Header currentView="profile" onNavigate={onNavigate} />
      <div className="pt-14 min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              {t('profile.title', { defaultValue: 'プロフィール編集' })}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('profile.description', { defaultValue: 'アカウント情報を編集できます' })}
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6 space-y-6">
            {/* アバター表示 */}
            <div className="flex items-center gap-4">
              <Avatar className="size-20">
                <AvatarImage src={user.imageUrl || undefined} alt={displayName} />
                <AvatarFallback className="text-2xl font-medium">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('profile.avatarNote', {
                    defaultValue: 'プロフィール画像はClerkの設定から変更できます',
                  })}
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('profile.name', { defaultValue: '名前' })}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('profile.namePlaceholder', { defaultValue: '名前を入力' })}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={isUpdating}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('profile.nameHint', {
                      defaultValue: '表示名として使用されます',
                    })}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('profile.email', { defaultValue: 'メールアドレス' })}</Label>
                  <Input
                    type="email"
                    value={user.emailAddresses[0]?.emailAddress || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('profile.emailNote', {
                      defaultValue: 'メールアドレスはClerkの設定から変更できます',
                    })}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isUpdating || name === (user.fullName || user.firstName || '')}
                >
                  {isUpdating
                    ? t('loading', { defaultValue: '読み込み中...' })
                    : t('profile.update', { defaultValue: '更新' })}
                </Button>
              </form>
            </div>

            {/* 認証方法の表示 */}
            <div className="border-t pt-6">
              <h3 className="font-medium mb-3">
                {t('profile.authMethods', { defaultValue: '認証方法' })}
              </h3>
              <div className="space-y-2">
                {(user.emailAddresses || []).map(email => (
                  <div
                    key={email.id}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <span className="text-sm">{email.emailAddress}</span>
                    {email.verification?.status === 'verified' && (
                      <span className="text-xs text-muted-foreground">
                        {t('profile.verified', { defaultValue: '確認済み' })}
                      </span>
                    )}
                  </div>
                ))}
                {(user.externalAccounts || []).map(account => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <span className="text-sm">
                      {account.provider === 'google' && 'Google'}
                      {account.provider === 'github' && 'GitHub'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('profile.connected', { defaultValue: '接続済み' })}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('profile.authMethodsNote', {
                  defaultValue: '認証方法の追加・削除はClerkの設定から行えます',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
