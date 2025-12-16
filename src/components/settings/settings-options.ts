import { ThemeType, PracticeMode, DifficultyPreset } from '@/lib/types'
import { Target, Shuffle, History, Flame, Trophy, Skull } from 'lucide-react'

export const MIN_WORD_COUNT = 5
export const MAX_WORD_COUNT = 100
export const STEP = 5

export const THEME_OPTIONS: { value: ThemeType; labelKey: string; descKey: string }[] = [
  { value: 'light', labelKey: 'theme.light', descKey: 'theme.light_desc' },
  { value: 'dark', labelKey: 'theme.dark', descKey: 'theme.dark_desc' },
  { value: 'system', labelKey: 'theme.system', descKey: 'theme.system_desc' },
]

export const PRACTICE_MODE_OPTIONS: { 
  value: PracticeMode
  labelKey: string
  descKey: string
  icon: typeof Target
}[] = [
  { value: 'random', labelKey: 'practice_mode.random', descKey: 'practice_mode.random_desc', icon: Shuffle },
  { value: 'weakness-focus', labelKey: 'practice_mode.weakness', descKey: 'practice_mode.weakness_desc', icon: Target },
  { value: 'review', labelKey: 'practice_mode.review', descKey: 'practice_mode.review_desc', icon: History },
]

export const DIFFICULTY_OPTIONS: {
  value: DifficultyPreset
  labelKey: string
  descKey: string
  icon: typeof Flame
  color: string
}[] = [
  { value: 'easy', labelKey: 'difficulty.easy', descKey: 'difficulty.easy_desc', icon: Target, color: 'text-green-500' },
  { value: 'normal', labelKey: 'difficulty.normal', descKey: 'difficulty.normal_desc', icon: Flame, color: 'text-yellow-500' },
  { value: 'hard', labelKey: 'difficulty.hard', descKey: 'difficulty.hard_desc', icon: Trophy, color: 'text-orange-500' },
  { value: 'expert', labelKey: 'difficulty.expert', descKey: 'difficulty.expert_desc', icon: Skull, color: 'text-red-500' },
]

