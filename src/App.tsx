import { useCallback, useEffect, useRef, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { Header } from '@/components/Header'
import { MenuScreen } from '@/components/MenuScreen'
import { GameScreen } from '@/components/GameScreen'
import { GameOverScreen } from '@/components/GameOverScreen'
import { WordManagementScreen } from '@/components/WordManagementScreen'
import { StatsScreen } from '@/components/StatsScreen'
import { SettingsScreen } from '@/components/SettingsScreen'
import { PresetScreen } from '@/components/PresetScreen'
import { AddWordDialog } from '@/components/AddWordDialog'
import { useWords } from '@/hooks/useWords'
import { useGame, ViewType } from '@/hooks/useGame'
import { useTypingAnalytics } from '@/hooks/useTypingAnalytics'
import { useSettings } from '@/hooks/useSettings'
import { shuffleArray } from '@/lib/utils'
import { usePresets } from '@/hooks/usePresets'
import { toast } from 'sonner'
import type { PresetWord } from '@/lib/types'

function App() {
  const {
    words,
    addWord,
    editWord,
    deleteWord,
    updateWordStats,
    loadPreset,
    clearAllWords,
    refetch: refetchWords,
  } = useWords()
  const { getPresetById } = usePresets()
  const [isAddWordDialogOpen, setIsAddWordDialogOpen] = useState(false)
  const [isQuickStartMode, setIsQuickStartMode] = useState(false)
  const [quickStartWordIds, setQuickStartWordIds] = useState<Set<string>>(new Set())
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
    // 設定リセット
    resetSettings,
  } = useSettings()

  // 初回ユーザー判定（単語が0件、ゲームスコアが0件、統計データがない）
  const isFirstTime =
    words.length === 0 &&
    gameScores.length === 0 &&
    (!aggregatedStats || Object.keys(aggregatedStats.keyStats).length === 0)

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

    // クイックスタートモードの場合は5問に制限
    const wordLimit = isQuickStartMode ? 5 : undefined

    // スコアリングシステムで単語を選択（ソート済み）
    const sortedWords = selectWeaknessBasedWords(words, {
      practiceMode: settings.practiceMode,
      srsEnabled: settings.srsEnabled,
      warmupEnabled: settings.warmupEnabled,
    })

    // クイックスタートモードの場合は5問、通常モードの場合は設定に従う
    const effectiveCount = wordLimit || getEffectiveWordCount(sortedWords.length)

    // 問題数分を取得
    const selectedWords = sortedWords.slice(0, effectiveCount)

    // 弱点強化モードと復習優先モードでは、取得後にシャッフルして出題
    // ランダムモードは既にシャッフル済み
    if (settings.practiceMode === 'weakness-focus' || settings.practiceMode === 'review') {
      return shuffleArray(selectedWords)
    }

    return selectedWords
  }, [
    words,
    selectWeaknessBasedWords,
    getEffectiveWordCount,
    settings.practiceMode,
    settings.srsEnabled,
    settings.warmupEnabled,
    resetSessionState,
    isQuickStartMode,
  ])

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
    setIsQuickStartMode(false)
    startGame() // Uses getGameWords callback to apply settings
  }, [startGame])

  // クイックスタート: 基本単語を自動読み込みして短いゲームを開始
  const handleQuickStart = useCallback(async () => {
    try {
      // 基本日本語プリセットを取得
      const preset = await getPresetById('basic-japanese')
      if (!preset || preset.words.length === 0) {
        toast.error('基本日本語プリセットが見つかりません')
        return
      }

      // 基本日本語プリセットを読み込む
      await loadPreset(preset.words, {
        clearExisting: false,
        presetName: preset.name,
      })

      // クイックスタートモードを有効化
      setIsQuickStartMode(true)

      // ゲームを開始（getGameWordsで5問に制限される）
      startGame()
    } catch (error) {
      console.error('Failed to start quick start:', error)
      toast.error('クイックスタートの開始に失敗しました')
    }
  }, [loadPreset, startGame, getPresetById])

  // クイックスタートで読み込んだ単語のIDを記録
  useEffect(() => {
    if (isQuickStartMode && quickStartWordIds.size === 0) {
      // クイックスタートで読み込んだ単語は最初の5語と仮定
      // （実際にはloadPresetで読み込まれた単語を記録する）
      const loadedWords = words.slice(0, 5)
      if (loadedWords.length > 0) {
        setQuickStartWordIds(new Set(loadedWords.map(w => w.id)))
      }
    }
  }, [isQuickStartMode, words, quickStartWordIds.size])

  // クイックスタートで使用した単語を削除
  const cleanupQuickStartWords = useCallback(async () => {
    if (quickStartWordIds.size === 0) return

    try {
      // クイックスタートで使用した単語を削除
      for (const wordId of quickStartWordIds) {
        await deleteWord(wordId)
      }
      setQuickStartWordIds(new Set())
    } catch (error) {
      console.error('Failed to cleanup quick start words:', error)
    }
  }, [quickStartWordIds, deleteWord])

  // プリセット選択後の処理
  const handlePresetSelected = useCallback(
    async (presetWords: PresetWord[], options: { clearExisting: boolean; presetName: string }) => {
      try {
        // クイックスタートで使用した単語を削除
        await cleanupQuickStartWords()

        // 選択されたプリセットを読み込む
        await loadPreset(presetWords, {
          clearExisting: isQuickStartMode ? true : options.clearExisting, // クイックスタートの場合は常にクリア
          presetName: options.presetName,
        })

        // クイックスタートモードをリセット
        setIsQuickStartMode(false)
        setQuickStartWordIds(new Set())

        // メニューに戻る
        setView('menu')

        toast.success(`${options.presetName}を読み込みました`)
      } catch (error) {
        console.error('Failed to load preset:', error)
        toast.error('プリセットの読み込みに失敗しました')
      }
    },
    [cleanupQuickStartWords, loadPreset, setView, isQuickStartMode]
  )

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
          hasMistakes={gameStats.wordPerformances.some(p => p.missCount > 0 || !p.completed)}
          onRestart={handleStartGame}
          onRetryWeak={retryWeakWords}
          onExit={() => {
            if (isQuickStartMode) {
              // クイックスタートモードの場合、プリセット選択画面に遷移
              setView('presets')
            } else {
              setIsQuickStartMode(false)
              setView('menu')
            }
          }}
          isQuickStartMode={isQuickStartMode}
          onApplyRecommendedDifficulty={updateDifficultyPreset}
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
          onNavigate={handleNavigate}
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

  if (view === 'presets') {
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
        <PresetScreen
          onLoadPreset={handlePresetSelected}
          onNavigate={handleNavigate}
          isLoading={false}
          isAfterQuickStart={isQuickStartMode}
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
          // 全データリセット
          onResetAll={async () => {
            try {
              // 全てのデータをリセット
              await Promise.all([clearAllWords(), resetStats(), resetSettings()])
              // 単語リストを再取得
              await refetchWords()
              // メニューに戻る（クイックスタートが表示されるように）
              setView('menu')
            } catch (error) {
              console.error('Failed to reset all data:', error)
              throw error
            }
          }}
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
        onQuickStart={handleQuickStart}
        isFirstTime={isFirstTime}
        gameScoresCount={gameScores.length}
        onLoadPreset={loadPreset}
        onNavigate={handleNavigate}
      />
    </>
  )
}

export default App
