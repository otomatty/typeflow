/**
 * Tauri環境ユーティリティ
 * Tauriデスクトップアプリとして実行されているかどうかを検出し、
 * プラットフォーム固有の機能へのアクセスを提供します
 */

/**
 * アプリがTauri環境で実行されているかどうかを判定
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * 現在のプラットフォームを取得
 * @returns 'web' | 'macos' | 'windows' | 'linux'
 */
export async function getPlatform(): Promise<string> {
  if (!isTauri()) {
    return 'web'
  }

  try {
    const { platform } = await import('@tauri-apps/plugin-os')
    return platform()
  } catch {
    return 'web'
  }
}

/**
 * Tauriコマンドを安全に呼び出すラッパー
 * Web環境では何もしない
 */
export async function invokeTauriCommand<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T | null> {
  if (!isTauri()) {
    console.warn(`Tauri command "${command}" called in non-Tauri environment`)
    return null
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke<T>(command, args)
  } catch (error) {
    console.error(`Failed to invoke Tauri command "${command}":`, error)
    return null
  }
}

/**
 * システムのデフォルトブラウザでURLを開く
 * Web環境では通常のwindow.openを使用
 */
export async function openExternal(url: string): Promise<void> {
  if (!isTauri()) {
    window.open(url, '_blank')
    return
  }

  try {
    const { open } = await import('@tauri-apps/plugin-shell')
    await open(url)
  } catch (error) {
    console.error('Failed to open external URL:', error)
    // フォールバックとして通常のリンクを開く
    window.open(url, '_blank')
  }
}
