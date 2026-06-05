'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthHydrated } from '@/hooks/use-auth-hydrated'
import { useAuthStore } from '@/lib/auth-store'

/** Protege las rutas autenticadas: redirige a /login si no hay sesión. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hydrated = useAuthHydrated()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/login')
    }
  }, [hydrated, isAuthenticated, router])

  // Aún rehidratando o sin sesión: no renderizamos el contenido protegido.
  if (!hydrated || !isAuthenticated) return null

  return <>{children}</>
}
