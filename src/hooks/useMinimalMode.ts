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
  // サーバスナップショット（第3引数）は window 非依存にして、テスト/プリレンダー/将来のSSRなど
  // window が無い環境でも安全に評価できるようにする。breakpoint より大きい値を返すことで
  // 'auto' 時のサーバ側デフォルトは「非ミニマル」になる。
  const width = useSyncExternalStore(subscribeToResize, getWindowWidth, () => breakpoint + 1)

  // 'always' の場合は常にミニマル
  if (minimalMode === 'always') return true

  // 'off' の場合は常に通常モード
  if (minimalMode === 'off') return false

  // 'auto' の場合は画面サイズに応じて切り替え
  return width <= breakpoint
}
