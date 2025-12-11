import { motion } from 'framer-motion'
import { Word } from '@/lib/types'
import { normalizeRomaji, getMatchingVariation } from '@/lib/romaji-utils'

interface TypingDisplayProps {
  word: Word
  currentInput: string
  showError: boolean
}

export function TypingDisplay({ word, currentInput, showError }: TypingDisplayProps) {
  const normalizedInput = normalizeRomaji(currentInput)
  
  // Get the variation that matches the current input
  const matchingVariation = getMatchingVariation(word.romaji, currentInput)
  const displayTarget = matchingVariation || normalizeRomaji(word.romaji)

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
