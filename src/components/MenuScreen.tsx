import { motion } from 'framer-motion'
import { Keyboard } from '@phosphor-icons/react'
import { Word } from '@/lib/types'

interface MenuScreenProps {
  words: Word[]
  onStartGame: () => void
}

export function MenuScreen({ words }: MenuScreenProps) {
  const canStart = words.length > 0

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8"
      >
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            TypeFlow
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Developer Typing Trainer
          </p>
        </div>

        {canStart ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Keyboard className="w-6 h-6" />
              <span className="text-lg">{words.length} words ready</span>
            </div>

            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="pt-8"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-secondary/50 border border-border/50">
                <kbd className="px-3 py-1.5 text-sm font-mono bg-background rounded border border-border shadow-sm">
                  Space
                </kbd>
                <span className="text-muted-foreground">Press to Start</span>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-4"
          >
            <p className="text-muted-foreground">
              No words yet. Add words to start practicing!
            </p>
            <p className="text-sm text-muted-foreground/60">
              Go to <span className="font-medium text-muted-foreground">Words</span> in the menu to add words
            </p>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute bottom-8 text-center text-xs text-muted-foreground/50"
      >
        <p>Press <kbd className="px-1 py-0.5 bg-secondary/50 rounded">Esc</kbd> during game to exit</p>
      </motion.div>
    </div>
  )
}
