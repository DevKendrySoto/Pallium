'use client'

import { useAuthStore } from '@/lib/auth-store'

/** Permisos efectivos del usuario actual (`recurso:acción`). */
export function usePermissions(): string[] {
  return useAuthStore((s) => s.user?.permissions ?? [])
}

/** true si el usuario tiene el permiso indicado. */
export function useHasPermission(permission: string): boolean {
  return useAuthStore((s) => (s.user?.permissions ?? []).includes(permission))
}
