import { useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'

interface TimeGaugeProps {
  timeRemaining: number
  totalTime: number
}

export function TimeGauge({ timeRemaining, totalTime }: TimeGaugeProps) {
  const { t } = useTranslation('game')
  const shouldReduceMotion = useReducedMotion()
  const percentage = (timeRemaining / totalTime) * 100
  const isLow = percentage < 25
  const secondsRemaining = Math.max(0, Math.ceil(timeRemaining))

  const getColor = () => {
    if (percentage > 50) return 'bg-primary'
    if (percentage > 25) return 'bg-yellow-500'
    return 'bg-accent'
  }

  return (
    <div className="w-full px-4 sm:px-8">
      <div
        className="relative"
        role="timer"
        aria-label={t('a11y.time_remaining', { count: secondsRemaining })}
      >
        <Progress value={percentage} className="h-2 sm:h-3 bg-secondary" />
        <motion.div
          className={`absolute inset-0 h-2 sm:h-3 rounded-full ${getColor()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
          animate={isLow && !shouldReduceMotion ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          aria-hidden="true"
        />
      </div>
      <span className="sr-only">{t('a11y.time_remaining', { count: secondsRemaining })}</span>
      {isLow && (
        <span className="sr-only" role="alert">
          {t('a11y.time_low')}
        </span>
      )}
    </div>
  )
}
