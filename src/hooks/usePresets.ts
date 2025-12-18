import { useState, useEffect, useCallback } from 'react'
import { getAllPresetsFromAPI, getPresetByIdFromAPIAsync } from '@/lib/presets'
import type { WordPreset } from '@/lib/types'

/**
 * プリセット管理用のカスタムフック
 * クラウド上のプリセットデータを管理します
 */
export function usePresets() {
  const [presets, setPresets] = useState<WordPreset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // プリセット一覧を取得
  const fetchPresets = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const fetchedPresets = await getAllPresetsFromAPI()
      setPresets(fetchedPresets)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch presets')
      setError(error)
      console.error('Failed to fetch presets:', error)
      setPresets([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // プリセットをIDで取得
  const getPresetById = useCallback(
    async (id: string): Promise<WordPreset | undefined> => {
      try {
        // まずローカルキャッシュから検索
        const cachedPreset = presets.find(p => p.id === id)
        if (cachedPreset) {
          return cachedPreset
        }

        // キャッシュにない場合はAPIから取得
        const preset = await getPresetByIdFromAPIAsync(id)
        if (preset) {
          // キャッシュに追加
          setPresets(prev => {
            if (prev.find(p => p.id === id)) {
              return prev
            }
            return [...prev, preset]
          })
        }
        return preset
      } catch (err) {
        console.error(`Failed to fetch preset ${id}:`, err)
        return undefined
      }
    },
    [presets]
  )

  // 初回マウント時にプリセットを取得
  useEffect(() => {
    fetchPresets()
  }, [fetchPresets])

  return {
    presets,
    isLoading,
    error,
    refetch: fetchPresets,
    getPresetById,
  }
}
