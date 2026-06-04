import type { AuthUser } from '@/types/auth'

export interface LoginRequest {
  email: string
  password: string
}

/** Respuesta de POST /auth/login del backend. */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}
