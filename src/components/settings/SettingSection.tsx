import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface SettingSectionProps {
  delay?: number
  children: ReactNode
}

export function SettingSection({ delay = 0, children }: SettingSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  )
}
