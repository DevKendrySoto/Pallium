import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, Role } from '@/types/auth'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  role: Role | null
  isAuthenticated: boolean
  setSession: (session: {
    token: string
    refreshToken: string
    user: AuthUser
    role: Role
  }) => void
  setTokens: (token: string, refreshToken: string) => void
  logout: () => void
}

/**
 * Store de autenticación con persistencia en localStorage.
 * El wrapper de API lee el token desde aquí y dispara logout en 401.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      role: null,
      isAuthenticated: false,
      setSession: ({ token, refreshToken, user, role }) =>
        set({ token, refreshToken, user, role, isAuthenticated: true }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      logout: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          role: null,
          isAuthenticated: false,
        }),
    }),
    { name: 'pallium-auth' },
  ),
)
