import type { WordPreset } from './types'
import { getAllPresets, getPresetById as getPresetByIdFromAPI } from './db'

/**
 * プリセットデータはTursoクラウドで管理されています。
 * APIから取得する関数を提供します。
 */

// APIから全プリセットを取得
export async function getAllPresetsFromAPI(): Promise<WordPreset[]> {
  try {
    const presets = await getAllPresets()
    return presets.map(preset => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      difficulty: preset.difficulty,
      wordCount: preset.wordCount,
      words: preset.words,
    }))
  } catch (error) {
    console.error('Failed to fetch presets from API:', error)
    return []
  }
}

// APIからプリセットをIDで取得
export async function getPresetByIdFromAPIAsync(_id: string): Promise<WordPreset | undefined> {
  try {
    const preset = await getPresetByIdFromAPI(_id)
    if (!preset) {
      return undefined
    }
    return {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      difficulty: preset.difficulty,
      wordCount: preset.wordCount,
      words: preset.words,
    }
  } catch (error) {
    console.error(`Failed to fetch preset ${_id} from API:`, error)
    return undefined
  }
}

// 同期版（後方互換性のため、空の配列を返す）
export const allPresets: WordPreset[] = []

// 同期版（後方互換性のため、undefinedを返す）
export function getPresetById(_id: string): WordPreset | undefined {
  console.warn(
    'getPresetById is deprecated. Use getPresetByIdFromAPIAsync or fetch presets from API.'
  )
  return undefined
}

// プリセット一覧を取得（単語データなしの軽量版）
export async function getPresetList(): Promise<Omit<WordPreset, 'words'>[]> {
  try {
    const presets = await getAllPresets()
    return presets.map(({ words: _words, ...rest }) => rest)
  } catch (error) {
    console.error('Failed to fetch preset list from API:', error)
    return []
  }
}
