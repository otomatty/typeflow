import type { Context } from 'hono'
import type { Env } from './types'
import { createClerkClient, verifyToken } from '@clerk/backend'

// Honoのコンテキスト変数の型定義（index.tsと一致させる）
type HonoVariables = {
  auth: AuthContext
  tursoToken: string | null
}

/**
 * 認証ミドルウェア
 * Clerk JWT認証を実装
 */

export interface AuthUser {
  id: string
  username: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
}

export interface AuthContext {
  user: AuthUser | null
  isAuthenticated: boolean
}

// Clerkクライアントの初期化
let clerkClient: ReturnType<typeof createClerkClient> | null = null

function getClerkClient() {
  if (!clerkClient) {
    const secretKey = process.env.CLERK_SECRET_KEY
    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY environment variable is required')
    }
    clerkClient = createClerkClient({ secretKey })
  }
  return clerkClient
}

/**
 * リクエストからJWTトークンを取得
 */
function getTokenFromRequest(
  c: Context<{ Bindings: Env; Variables: HonoVariables }>
): string | null {
  // Authorizationヘッダーから取得
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return null
}

/**
 * 認証ミドルウェア
 * Clerk JWTトークンを検証し、Tursoクライアントに渡す
 */
export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: HonoVariables }>,
  next: () => Promise<void>
): Promise<void> {
  const token = getTokenFromRequest(c)

  if (!token) {
    c.set('auth', {
      user: null,
      isAuthenticated: false,
    })
    c.set('tursoToken', null)
    await next()
    return
  }

  try {
    const clerk = getClerkClient()
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    })

    if (!payload) {
      c.set('auth', {
        user: null,
        isAuthenticated: false,
      })
      c.set('tursoToken', null)
      await next()
      return
    }

    // Clerkのユーザー情報を取得
    const userId = payload.sub
    const user = await clerk.users.getUser(userId)

    c.set('auth', {
      user: {
        id: user.id,
        username: user.username,
        email: user.emailAddresses[0]?.emailAddress || null,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      isAuthenticated: true,
    })

    // TursoクライアントにClerkのJWTトークンを渡す
    // TursoはClerkのJWTトークンを直接使用してデータベースアクセスを制御
    c.set('tursoToken', token)
  } catch (error) {
    console.error('Failed to verify Clerk token:', error)
    c.set('auth', {
      user: null,
      isAuthenticated: false,
    })
    c.set('tursoToken', null)
  }

  await next()
}

/**
 * 認証必須ミドルウェア
 * 認証されていないリクエストを拒否
 */
export async function requireAuth(
  c: Context<{ Bindings: Env; Variables: HonoVariables }>,
  next: () => Promise<void>
): Promise<Response | void> {
  const auth = c.get('auth')

  if (!auth || !auth.isAuthenticated) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
}

/**
 * ユーザーIDを取得
 */
export function getUserId(c: Context<{ Bindings: Env; Variables: HonoVariables }>): string | null {
  const auth = c.get('auth')
  return auth?.user?.id ?? null
}

/**
 * 認証ユーザーを取得
 */
export function getAuthUser(
  c: Context<{ Bindings: Env; Variables: HonoVariables }>
): AuthUser | null {
  const auth = c.get('auth')
  return auth?.user ?? null
}
