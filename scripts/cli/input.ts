/**
 * CLI Input Module
 * ターミナルでのキー入力処理
 */

import * as readline from 'readline'

export type KeyHandler = (key: string, ctrl: boolean, meta: boolean) => void

/**
 * Raw mode でキー入力を監視
 */
export class InputManager {
  private handler: KeyHandler | null = null
  private isListening: boolean = false

  /**
   * キー入力の監視を開始
   */
  start(handler: KeyHandler): void {
    this.handler = handler
    this.isListening = true

    // stdin を raw mode に設定
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
    }
    process.stdin.resume()

    // keypress イベントを有効化
    readline.emitKeypressEvents(process.stdin)

    // キー入力イベントをリッスン
    process.stdin.on('keypress', this.onKeypress)
  }

  /**
   * キー入力の監視を停止
   */
  stop(): void {
    this.isListening = false
    this.handler = null

    process.stdin.removeListener('keypress', this.onKeypress)

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false)
    }
    process.stdin.pause()
  }

  /**
   * キー入力イベントハンドラ
   */
  private onKeypress = (str: string | undefined, key: readline.Key): void => {
    if (!this.isListening || !this.handler) return

    // Ctrl+C で終了
    if (key.ctrl && key.name === 'c') {
      this.stop()
      process.exit(0)
    }

    // キー情報を渡す
    const keyName = key.name || str || ''
    this.handler(keyName, key.ctrl || false, key.meta || false)
  }
}

/**
 * 一度だけキー入力を待つ
 */
export function waitForKey(): Promise<string> {
  return new Promise(resolve => {
    const manager = new InputManager()

    manager.start(key => {
      manager.stop()
      resolve(key)
    })
  })
}

/**
 * Enter キーを待つ
 */
export function waitForEnter(): Promise<void> {
  return new Promise(resolve => {
    const manager = new InputManager()

    manager.start(key => {
      if (key === 'return' || key === 'enter') {
        manager.stop()
        resolve()
      }
    })
  })
}

/**
 * 確認プロンプト
 */
export async function confirm(message: string): Promise<boolean> {
  process.stdout.write(`${message} (y/n): `)

  return new Promise(resolve => {
    const manager = new InputManager()

    manager.start(key => {
      if (key === 'y' || key === 'Y') {
        manager.stop()
        console.log('yes')
        resolve(true)
      } else if (key === 'n' || key === 'N' || key === 'escape') {
        manager.stop()
        console.log('no')
        resolve(false)
      }
    })
  })
}
