import { Word } from '@/lib/types'

interface MinimalTypingDisplayProps {
  word: Word
  currentInput: string
  showError: boolean
}

/**
 * ミニマルモード用のタイピング表示コンポーネント
 * テキストエディタ風のシンプルなUIで、仕事中でも目立たない
 */
export function MinimalTypingDisplay({ word, currentInput, showError }: MinimalTypingDisplayProps) {
  return (
    <div
      className={`
        font-mono text-sm leading-relaxed p-3
        bg-background border border-border/30 rounded
        transition-colors duration-100
        ${showError ? 'bg-destructive/5 border-destructive/30' : ''}
      `}
    >
      {/* メインのローマ字表示（エディタ風） */}
      <div className="flex items-baseline gap-0.5">
        {/* プロンプト風の装飾（コードエディタっぽく） */}
        <span className="text-muted-foreground/40 select-none mr-2">&gt;</span>

        {/* 入力済み部分 */}
        <span className="text-primary">{currentInput}</span>

        {/* カーソル */}
        <span className="inline-block w-[2px] h-4 bg-primary animate-pulse" />
      </div>

      {/* 日本語表示（サブテキスト） */}
      <div className="mt-1 text-xs flex items-center gap-2">
        <span className="text-muted-foreground/30 select-none">#</span>
        <span className="text-muted-foreground">{word.text}</span>
        <span className="text-muted-foreground/20">|</span>
        <span className="text-muted-foreground">{word.reading}</span>
      </div>
    </div>
  )
}
