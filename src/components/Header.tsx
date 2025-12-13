import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { House, ListBullets, ChartBar, Gear } from '@phosphor-icons/react'

type ViewType = 'menu' | 'words' | 'stats' | 'settings' | 'game' | 'gameover'

interface HeaderProps {
  currentView: ViewType
  onNavigate: (view: ViewType) => void
}

export function Header({ currentView, onNavigate }: HeaderProps) {
  const { t } = useTranslation()

  // Don't show header during game or gameover
  if (currentView === 'game' || currentView === 'gameover') {
    return null
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="max-w-4xl mx-auto px-4 lg:px-0 h-14 flex items-center justify-between">
        <button
          onClick={() => onNavigate('menu')}
          className="font-bold text-lg tracking-tight hover:text-primary transition-colors"
        >
          TypeFlow
        </button>

        <nav className="flex items-center gap-1">
          <Button
            variant={currentView === 'menu' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onNavigate('menu')}
            className="gap-2"
          >
            <House className="w-4 h-4" />
            <span className="hidden sm:inline">{t('header.home')}</span>
          </Button>
          <Button
            variant={currentView === 'words' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onNavigate('words')}
            className="gap-2"
          >
            <ListBullets className="w-4 h-4" />
            <span className="hidden sm:inline">{t('header.words')}</span>
          </Button>
          <Button
            variant={currentView === 'stats' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onNavigate('stats')}
            className="gap-2"
          >
            <ChartBar className="w-4 h-4" />
            <span className="hidden sm:inline">{t('header.stats')}</span>
          </Button>
          <Button
            variant={currentView === 'settings' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onNavigate('settings')}
            className="gap-2"
          >
            <Gear className="w-4 h-4" />
            <span className="hidden sm:inline">{t('header.settings')}</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}
