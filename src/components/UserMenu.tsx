import { useTranslation } from 'react-i18next'
import { useClerk } from '@clerk/clerk-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, Settings, Package, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { ViewType } from '@/hooks/useGame'

interface UserMenuProps {
  onNavigate: (view: ViewType) => void
}

export function UserMenu({ onNavigate }: UserMenuProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { signOut } = useClerk()

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  // ユーザー名の頭文字を取得（フォールバック用）
  const getInitials = () => {
    if (user.name) {
      const parts = user.name.split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return user.name[0].toUpperCase()
    }
    if (user.username) {
      return user.username[0].toUpperCase()
    }
    if (user.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const displayName = user.name || user.username || user.email || 'User'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <Avatar className="size-8">
            <AvatarImage src={user.imageUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-xs font-medium">{getInitials()}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onNavigate('profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>{t('userMenu.profile', { defaultValue: 'プロフィール編集' })}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate('settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>{t('userMenu.settings', { defaultValue: '設定' })}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate('presets')}>
          <Package className="mr-2 h-4 w-4" />
          <span>{t('userMenu.presets', { defaultValue: 'プリセット' })}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('userMenu.logout', { defaultValue: 'ログアウト' })}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
