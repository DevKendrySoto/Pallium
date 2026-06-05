'use client'

import { useAuthStore } from '@/lib/auth-store'

/**
 * true si el usuario actual es de solo lectura (Auditor).
 * Usa `isReadOnly` del backend; si el token es previo, cae al rol como respaldo.
 */
export function useReadOnly(): boolean {
  return useAuthStore((s) => s.user?.isReadOnly ?? s.role === 'AUDITOR')
}
