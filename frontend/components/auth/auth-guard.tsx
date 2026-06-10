'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthHydrated } from '@/hooks/use-auth-hydrated'
import { useAuthStore } from '@/lib/auth-store'

/** Protege las rutas autenticadas: redirige a /login si no hay sesión. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const hydrated = useAuthHydrated()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const mustChangePassword = useAuthStore((s) => s.user?.mustChangePassword ?? false)

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) {
      router.replace('/login')
    } else if (mustChangePassword && pathname !== '/perfil') {
      // Cuenta con contraseña temporal: forzamos el cambio antes de usar el sistema.
      router.replace('/perfil')
    }
  }, [hydrated, isAuthenticated, mustChangePassword, pathname, router])

  // Aún rehidratando o sin sesión: no renderizamos el contenido protegido.
  if (!hydrated || !isAuthenticated) return null
  // Bloqueo de forzar-cambio: solo dejamos pasar /perfil hasta que cambie la clave.
  if (mustChangePassword && pathname !== '/perfil') return null

  return <>{children}</>
}
