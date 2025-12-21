import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react'

export interface User {
  id: string
  username: string | null
  email: string | null
  name: string | null // フルネーム（firstName + lastName または fullName）
  imageUrl: string | null
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  getToken: () => Promise<string | null>
  getTursoToken: () => Promise<string | null>
}

/**
 * Clerk認証を使用する認証フック
 */
export function useAuth(): AuthContextType {
  const { user: clerkUser, isLoaded } = useUser()
  const { getToken } = useClerkAuth()

  const user: User | null = clerkUser
    ? {
        id: clerkUser.id,
        username: clerkUser.username,
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        name:
          clerkUser.fullName ||
          (clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.firstName) ||
          null,
        imageUrl: clerkUser.imageUrl || null,
      }
    : null

  return {
    user,
    isAuthenticated: !!clerkUser,
    isLoading: !isLoaded,
    getToken: async () => {
      try {
        return await getToken()
      } catch (error) {
        console.error('Failed to get token:', error)
        return null
      }
    },
    // Turso用のJWTトークンを取得（turso-jwtテンプレートを使用）
    getTursoToken: async () => {
      try {
        return await getToken({ template: 'turso-jwt' })
      } catch (error) {
        console.error('Failed to get Turso token:', error)
        return null
      }
    },
  }
}
