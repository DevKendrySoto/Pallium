'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'

/**
 * Indica si el store persistido ya rehidrató desde localStorage.
 * Evita redirigir/parpadear antes de conocer el estado real de sesión.
 * El acceso a `persist` se hace solo en el cliente (no en el prerender SSR).
 */
export function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(useAuthStore.persist.hasHydrated())
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  return hydrated
}
