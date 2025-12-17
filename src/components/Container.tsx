import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'

interface ContainerProps {
  children: ReactNode
  maxWidth?: MaxWidth
  className?: string
}

const maxWidthClasses: Record<MaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
}

export function Container({ children, maxWidth = '4xl', className }: ContainerProps) {
  return (
    <div className="min-h-screen pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      <div className={cn(maxWidthClasses[maxWidth], 'mx-auto', className)}>{children}</div>
    </div>
  )
}
