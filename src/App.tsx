import { Toaster } from '@/components/ui/sonner'
import { Header } from '@/components/Header'
import { MenuScreen } from '@/components/MenuScreen'
import { GameScreen } from '@/components/GameScreen'
import { GameOverScreen } from '@/components/GameOverScreen'
import { WordManagementScreen } from '@/components/WordManagementScreen'
import { useWords } from '@/hooks/useWords'
import { useGame, ViewType } from '@/hooks/useGame'

function App() {
  const { words, addWord, deleteWord, updateWordStats } = useWords()
  const {
    view,
    setView,
    gameState,
    showError,
    gameStats,
    startGame,
    retryWeakWords,
    calculateLiveStats,
  } = useGame({ words, updateWordStats })

  const handleNavigate = (newView: ViewType) => {
    setView(newView)
  }

  if (view === 'gameover') {
    return (
      <>
        <Toaster />
        <GameOverScreen
          stats={gameStats}
          hasMistakes={gameState.mistakeWords.length > 0}
          onRestart={() => startGame()}
          onRetryWeak={retryWeakWords}
          onExit={() => setView('menu')}
        />
      </>
    )
  }

  if (view === 'game' && gameState.isPlaying) {
    const currentWord = gameState.words[gameState.currentWordIndex]
    const liveStats = calculateLiveStats()

    return (
      <>
        <Toaster />
        <GameScreen
          currentWord={currentWord}
          gameState={gameState}
          showError={showError}
          liveStats={liveStats}
        />
      </>
    )
  }

  if (view === 'words') {
    return (
      <>
        <Toaster />
        <Header currentView={view} onNavigate={handleNavigate} />
        <WordManagementScreen
          words={words}
          onAddWord={addWord}
          onDeleteWord={deleteWord}
        />
      </>
    )
  }

  return (
    <>
      <Toaster />
      <Header currentView={view} onNavigate={handleNavigate} />
      <MenuScreen
        words={words}
        onStartGame={() => startGame()}
      />
    </>
  )
}

export default App
