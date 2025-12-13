import { useCallback, useEffect, useRef, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { Header } from '@/components/Header'
import { MenuScreen } from '@/components/MenuScreen'
import { GameScreen } from '@/components/GameScreen'
import { GameOverScreen } from '@/components/GameOverScreen'
import { WordManagementScreen } from '@/components/WordManagementScreen'
import { StatsScreen } from '@/components/StatsScreen'
import { SettingsScreen } from '@/components/SettingsScreen'
import { AddWordDialog } from '@/components/AddWordDialog'
import { useWords } from '@/hooks/useWords'
import { useGame, ViewType } from '@/hooks/useGame'
import { useTypingAnalytics } from '@/hooks/useTypingAnalytics'
import { useSettings } from '@/hooks/useSettings'

function App() {
  const { words, addWord, editWord, deleteWord, updateWordStats, loadPreset, clearAllWords } = useWords()
  const [isAddWordDialogOpen, setIsAddWordDialogOpen] = useState(false)
  const { 
    updateStats, 
    selectWeaknessBasedWords, 
    aggregatedStats, 
    gameScores, 
    resetStats, 
    saveScore,
    resetSessionState,
  } = useTypingAnalytics()
  const { 
    settings, 
    updateWordCount, 
    updateTheme, 
    updatePracticeMode,
    updateSrsEnabled,
    updateWarmupEnabled,
    getEffectiveWordCount,
    // 難易度プリセット
    updateDifficultyPreset,
  } = useSettings()

  // セッション終了時にキーストローク統計を更新
  const handleSessionEnd = useCallback(
    (keystrokes: import('@/lib/types').KeystrokeRecord[]) => {
      updateStats(keystrokes)
    },
    [updateStats]
  )

  // 設定を適用した単語リストを返すコールバック
  const getGameWords = useCallback(() => {
    // セッション状態をリセット
    resetSessionState()
    
    // 新しいスコアリングシステムで単語を選択
    const sortedWords = selectWeaknessBasedWords(words, {
      practiceMode: settings.practiceMode,
      srsEnabled: settings.srsEnabled,
      warmupEnabled: settings.warmupEnabled,
    })
    const effectiveCount = getEffectiveWordCount(sortedWords.length)
    return sortedWords.slice(0, effectiveCount)
  }, [words, selectWeaknessBasedWords, getEffectiveWordCount, settings.practiceMode, settings.srsEnabled, settings.warmupEnabled, resetSessionState])

  const {
    view,
    setView,
    gameState,
    showError,
    gameStats,
    startGame,
    retryWeakWords,
    calculateLiveStats,
  } = useGame({ 
    words, 
    updateWordStats, 
    onSessionEnd: handleSessionEnd, 
    getGameWords,
    // 制限時間計算用
    gameScores,
    settings,
  })

  // ゲーム終了時にスコアを保存
  const hasGameEnded = useRef(false)
  useEffect(() => {
    if (view === 'gameover' && !hasGameEnded.current) {
      hasGameEnded.current = true
      saveScore(gameStats)
    } else if (view !== 'gameover') {
      hasGameEnded.current = false
    }
  }, [view, gameStats, saveScore])

  // グローバルショートカット: Cmd+K (Mac) / Ctrl+K (Windows/Linux) でキーワード追加ダイアログを開く
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ゲーム中は無効
      if (view === 'game' && gameState.isPlaying) return
      
      // Cmd+K (Mac) または Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsAddWordDialogOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view, gameState.isPlaying])

  // 弱点ベースでソートされた単語でゲームを開始（設定の単語数を適用）
  const handleStartGame = useCallback(() => {
    startGame()  // Uses getGameWords callback to apply settings
  }, [startGame])

  const handleNavigate = (newView: ViewType) => {
    setView(newView)
  }

  if (view === 'gameover') {
    return (
      <>
        <Toaster />
        <AddWordDialog
          onAddWord={addWord}
          open={isAddWordDialogOpen}
          onOpenChange={setIsAddWordDialogOpen}
          showTrigger={false}
        />
        <GameOverScreen
          stats={gameStats}
          hasMistakes={gameState.mistakeWords.length > 0}
          onRestart={handleStartGame}
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
        <AddWordDialog
          onAddWord={addWord}
          open={isAddWordDialogOpen}
          onOpenChange={setIsAddWordDialogOpen}
          showTrigger={false}
        />
        <Header currentView={view} onNavigate={handleNavigate} />
        <WordManagementScreen
          words={words}
          onAddWord={addWord}
          onEditWord={editWord}
          onDeleteWord={deleteWord}
          onLoadPreset={loadPreset}
          onClearAllWords={clearAllWords}
        />
      </>
    )
  }

  if (view === 'stats') {
    return (
      <>
        <Toaster />
        <AddWordDialog
          onAddWord={addWord}
          open={isAddWordDialogOpen}
          onOpenChange={setIsAddWordDialogOpen}
          showTrigger={false}
        />
        <Header currentView={view} onNavigate={handleNavigate} />
        <StatsScreen
          keyStats={aggregatedStats?.keyStats ?? {}}
          transitionStats={aggregatedStats?.transitionStats ?? {}}
          gameScores={gameScores}
          onReset={resetStats}
        />
      </>
    )
  }

  if (view === 'settings') {
    return (
      <>
        <Toaster />
        <AddWordDialog
          onAddWord={addWord}
          open={isAddWordDialogOpen}
          onOpenChange={setIsAddWordDialogOpen}
          showTrigger={false}
        />
        <Header currentView={view} onNavigate={handleNavigate} />
        <SettingsScreen
          wordCount={settings.wordCount}
          theme={settings.theme}
          practiceMode={settings.practiceMode}
          srsEnabled={settings.srsEnabled}
          warmupEnabled={settings.warmupEnabled}
          // 難易度設定
          difficultyPreset={settings.difficultyPreset}
          // 制限時間設定
          minTimeLimit={settings.minTimeLimit}
          maxTimeLimit={settings.maxTimeLimit}
          gameScores={gameScores}
          onWordCountChange={updateWordCount}
          onThemeChange={updateTheme}
          onPracticeModeChange={updatePracticeMode}
          onSrsEnabledChange={updateSrsEnabled}
          onWarmupEnabledChange={updateWarmupEnabled}
          // 難易度設定のコールバック
          onDifficultyPresetChange={updateDifficultyPreset}
        />
      </>
    )
  }

  return (
    <>
      <Toaster />
      <AddWordDialog
        onAddWord={addWord}
        open={isAddWordDialogOpen}
        onOpenChange={setIsAddWordDialogOpen}
        showTrigger={false}
      />
      <Header currentView={view} onNavigate={handleNavigate} />
      <MenuScreen
        words={words}
        onStartGame={handleStartGame}
      />
    </>
  )
}

export default App
