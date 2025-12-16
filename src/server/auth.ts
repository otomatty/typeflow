import type { Context } from 'hono'
import type { Env } from './types'

/**
 * 認証ミドルウェア（将来の拡張用）
 * 
 * 現在はスケルトンのみ実装されています。
 * 将来的に以下の認証方式を実装可能：
 * - JWT認証
 * - APIキー認証
 * - OAuth認証
 * - セッション認証
 */

export interface AuthUser {
  id: string
  email?: string
  name?: string
}

export interface AuthContext {
  user: AuthUser | null
  isAuthenticated: boolean
}

/**
 * 認証ミドルウェア
 * リクエストから認証情報を取得し、コンテキストに追加
 */
export async function authMiddleware(
  c: Context<{ Bindings: Env }>,
  next: () => Promise<void>
): Promise<void> {
  // TODO: 認証ロジックを実装
  // 例: JWTトークンの検証、APIキーの確認など
  
  // 現時点では認証なしで通過
  c.set('auth', {
    user: null,
    isAuthenticated: false,
  } as AuthContext)

  await next()
}

/**
 * 認証必須ミドルウェア
 * 認証されていないリクエストを拒否
 */
export async function requireAuth(
  c: Context<{ Bindings: Env }>,
  next: () => Promise<void>
): Promise<void> {
  const auth = c.get('auth') as AuthContext | undefined

  if (!auth || !auth.isAuthenticated) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
}

/**
 * ユーザーIDを取得
 */
export function getUserId(c: Context<{ Bindings: Env }>): string | null {
  const auth = c.get('auth') as AuthContext | undefined
  return auth?.user?.id ?? null
}

/**
 * 認証ユーザーを取得
 */
export function getAuthUser(c: Context<{ Bindings: Env }>): AuthUser | null {
  const auth = c.get('auth') as AuthContext | undefined
  return auth?.user ?? null
}

