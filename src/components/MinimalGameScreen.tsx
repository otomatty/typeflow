import { MinimalTypingDisplay } from '@/components/MinimalTypingDisplay'
import { GameState, Word } from '@/lib/types'

interface MinimalGameScreenProps {
  currentWord: Word
  gameState: GameState
  showError: boolean
  liveStats: { kps: number; accuracy: number }
}

/**
 * ミニマルモード用のゲーム画面
 * 仕事中でも目立たないシンプルなテキストエディタ風UI
 * - タイムゲージなし
 * - 派手なアニメーションなし
 * - スコアは最小限の表示
 */
export function MinimalGameScreen({
  currentWord,
  gameState,
  showError,
  liveStats,
}: MinimalGameScreenProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background p-4">
      {/* メインのタイピングエリア（中央配置） */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <MinimalTypingDisplay
            word={currentWord}
            currentInput={gameState.currentInput}
            showError={showError}
          />
        </div>
      </div>

      {/* 最小限のステータスバー（フッター） */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/30 font-mono px-1">
        {/* 左側: 進捗（コメント風） */}
        <span>
          // {gameState.currentWordIndex + 1}/{gameState.words.length}
        </span>

        {/* 中央: KPS（控えめ） */}
        <span>{liveStats.kps.toFixed(1)} k/s</span>

        {/* 右側: 正確率 */}
        <span>{liveStats.accuracy}%</span>
      </div>

      {/* Escで終了のヒント（超控えめ） */}
      <div className="text-center text-[9px] text-muted-foreground/20 mt-1 font-mono">
        [esc] exit
      </div>
    </div>
  )
}
