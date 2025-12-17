import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface ScreenHeaderProps {
  title: string
  description: string
  action?: ReactNode
}

export function ScreenHeader({ title, description, action }: ScreenHeaderProps) {
  return (
    <motion.div
      className="flex items-center justify-between"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  )
}
