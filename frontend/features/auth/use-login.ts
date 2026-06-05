'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import type { LoginRequest, LoginResponse } from './types'

/** Login real contra el backend: guarda la sesión y redirige al dashboard. */
export function useLogin() {
  const router = useRouter()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (body: LoginRequest) =>
      api.post<LoginResponse>('/auth/login', body, { auth: false }),
    onSuccess: (data) => {
      setSession({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
        role: data.user.roles[0] ?? null,
      })
      toast.success('Sesión iniciada')
      router.replace('/')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo iniciar sesión')
    },
  })
}
