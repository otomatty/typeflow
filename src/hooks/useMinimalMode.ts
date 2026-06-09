import { useSyncExternalStore } from 'react'
import { MinimalModeType } from '@/lib/types'

function subscribeToResize(callback: () => void): () => void {
  window.addEventListener('resize', callback)
  return () => window.removeEventListener('resize', callback)
}

function getWindowWidth(): number {
  return window.innerWidth
}

/**
 * ミニマルモードの状態を管理するカスタムフック
 * 設定と画面サイズに基づいてミニマルモードを有効/無効にする
 *
 * 画面幅は useSyncExternalStore で購読し、最終的な真偽値はレンダー中に純粋に導出する。
 * これにより effect 内での同期 setState を避けつつ、props 変更とリサイズの双方に追従する。
 */
export function useMinimalMode(minimalMode: MinimalModeType, breakpoint: number = 600): boolean {
  const width = useSyncExternalStore(subscribeToResize, getWindowWidth, getWindowWidth)

  // 'always' の場合は常にミニマル
  if (minimalMode === 'always') return true

  // 'off' の場合は常に通常モード
  if (minimalMode === 'off') return false

  // 'auto' の場合は画面サイズに応じて切り替え
  return width <= breakpoint
}
