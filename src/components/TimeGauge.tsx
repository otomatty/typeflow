import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'

interface TimeGaugeProps {
  timeRemaining: number
  totalTime: number
}

export function TimeGauge({ timeRemaining, totalTime }: TimeGaugeProps) {
  const percentage = (timeRemaining / totalTime) * 100
  
  const getColor = () => {
    if (percentage > 50) return 'bg-primary'
    if (percentage > 25) return 'bg-yellow-500'
    return 'bg-accent'
  }

  return (
    <div className="w-full px-4 sm:px-8">
      <div className="relative">
        <Progress 
          value={percentage} 
          className="h-2 sm:h-3 bg-secondary"
        />
        <motion.div
          className={`absolute inset-0 h-2 sm:h-3 rounded-full ${getColor()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
          animate={percentage < 25 ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      </div>
    </div>
  )
}
