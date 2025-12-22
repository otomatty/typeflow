import { useState, useEffect } from 'react'
import { MinimalModeType } from '@/lib/types'

/**
 * ミニマルモードの状態を管理するカスタムフック
 * 設定と画面サイズに基づいてミニマルモードを有効/無効にする
 */
export function useMinimalMode(
  minimalMode: MinimalModeType,
  breakpoint: number = 600
): boolean {
  const [isMinimal, setIsMinimal] = useState(false)

  useEffect(() => {
    // 'always' の場合は常にミニマル
    if (minimalMode === 'always') {
      setIsMinimal(true)
      return
    }

    // 'off' の場合は常に通常モード
    if (minimalMode === 'off') {
      setIsMinimal(false)
      return
    }

    // 'auto' の場合は画面サイズに応じて切り替え
    const handleResize = () => {
      setIsMinimal(window.innerWidth <= breakpoint)
    }

    // 初期値を設定
    handleResize()

    // リサイズイベントを監視
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [minimalMode, breakpoint])

  return isMinimal
}
