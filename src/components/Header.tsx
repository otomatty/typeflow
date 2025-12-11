import { Button } from '@/components/ui/button'
import { House, ListBullets } from '@phosphor-icons/react'

type ViewType = 'menu' | 'words' | 'game' | 'gameover'

interface HeaderProps {
  currentView: ViewType
  onNavigate: (view: ViewType) => void
}

export function Header({ currentView, onNavigate }: HeaderProps) {
  // Don't show header during game or gameover
  if (currentView === 'game' || currentView === 'gameover') {
    return null
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
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
            <span className="hidden sm:inline">Home</span>
          </Button>
          <Button
            variant={currentView === 'words' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onNavigate('words')}
            className="gap-2"
          >
            <ListBullets className="w-4 h-4" />
            <span className="hidden sm:inline">Words</span>
          </Button>
        </nav>
      </div>
    </header>
  )
}
