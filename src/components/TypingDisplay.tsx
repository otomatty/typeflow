import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Word } from '@/lib/types'
import { normalizeRomaji, getMatchingVariation } from '@/lib/romaji-utils'

interface TypingDisplayProps {
  word: Word
  currentInput: string
  showError: boolean
}

export function TypingDisplay({ word, currentInput, showError }: TypingDisplayProps) {
  const { t } = useTranslation('game')
  const normalizedInput = normalizeRomaji(currentInput)
  
  // Get the variation that matches the current input
  const matchingVariation = getMatchingVariation(word.romaji, currentInput)
  const displayTarget = matchingVariation || normalizeRomaji(word.romaji)

  // 練習回数を計算
  const practiceCount = word.stats.correct + word.stats.miss

  const renderRomaji = () => {
    return displayTarget.split('').map((char, index) => {
      let className = 'text-muted-foreground'
      
      if (index < normalizedInput.length) {
        // Since we're showing the matching variation, all typed characters should match
        className = normalizedInput[index] === char 
          ? 'text-primary' 
          : 'text-accent'
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      )
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center gap-2 p-4"
    >
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-center tracking-tight">
        {word.text}
      </div>
      
      <div className="text-sm sm:text-base text-muted-foreground text-center">
        {word.reading}
      </div>
      
      <div className="text-base sm:text-lg md:text-xl font-medium tracking-wider mt-2">
        {renderRomaji()}
      </div>

      {/* 単語の過去統計（正確率・練習回数） */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/70">
        <div className="flex items-center gap-1">
          <span>{t('word_accuracy')}:</span>
          <span className={`font-medium tabular-nums ${
            practiceCount === 0 
              ? 'text-muted-foreground/50' 
              : word.stats.accuracy >= 80 
                ? 'text-green-500' 
                : word.stats.accuracy >= 50 
                  ? 'text-yellow-500' 
                  : 'text-red-500'
          }`}>
            {practiceCount > 0 ? `${Math.round(word.stats.accuracy)}%` : '-'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span>{t('practice_count')}:</span>
          <span className="font-medium tabular-nums">
            {practiceCount > 0 ? practiceCount : '-'}
          </span>
        </div>
      </div>

      {showError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-accent pointer-events-none"
          style={{ animation: 'flash-error 0.2s' }}
        />
      )}
    </motion.div>
  )
}
