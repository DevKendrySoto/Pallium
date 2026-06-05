'use client'

import type { ReactNode } from 'react'
import { useHasPermission } from '@/hooks/use-permission'

interface Props {
  /** Permiso requerido (`recurso:acción`). */
  permission: string
  children: ReactNode
  /** Qué renderizar si el usuario no tiene el permiso (por defecto, nada). */
  fallback?: ReactNode
}

/**
 * Renderiza `children` solo si el usuario tiene el permiso. Si no, muestra
 * `fallback` (útil para botones deshabilitados con tooltip explicativo).
 */
export function RequirePermission({ permission, children, fallback = null }: Props) {
  const allowed = useHasPermission(permission)
  return <>{allowed ? children : fallback}</>
}
