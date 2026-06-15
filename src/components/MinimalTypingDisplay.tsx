import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Word } from '@/lib/types'

interface MinimalTypingDisplayProps {
  word: Word
  currentInput: string
  showError: boolean
}

/**
 * ミニマルモード用のタイピング表示コンポーネント
 * テキストエディタ風のシンプルなUIで、仕事中でも目立たない
 * memo 化により入力/単語が変わったときだけ再レンダリングする。
 */
export const MinimalTypingDisplay = memo(function MinimalTypingDisplay({
  word,
  currentInput,
  showError,
}: MinimalTypingDisplayProps) {
  const { t } = useTranslation('game')

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
        <span className="text-muted-foreground/40 select-none mr-2" aria-hidden="true">
          &gt;
        </span>

        {/* 入力済み部分 */}
        <span className="text-primary">{currentInput}</span>

        {/* カーソル */}
        <span
          aria-hidden="true"
          className="inline-block w-[2px] h-4 bg-primary motion-safe:animate-pulse"
        />
      </div>

      {/* 日本語表示（サブテキスト） */}
      <div
        className="mt-1 text-xs flex items-center gap-2"
        role="status"
        aria-live="polite"
        aria-label={t('a11y.current_word', { word: word.text, reading: word.reading })}
      >
        <span className="text-muted-foreground/30 select-none" aria-hidden="true">
          #
        </span>
        <span className="text-muted-foreground">{word.text}</span>
        <span className="text-muted-foreground/20" aria-hidden="true">
          |
        </span>
        <span className="text-muted-foreground">{word.reading}</span>
      </div>
    </div>
  )
})
