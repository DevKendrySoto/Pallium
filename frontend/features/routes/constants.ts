import type { DispatchStatus, RouteStatus } from './types'

export const ROUTE_STATUS_LABELS: Record<RouteStatus, string> = {
  DRAFT: 'Borrador',
  PLANNED: 'Planificada',
  DISPATCHED: 'Despachada',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

export const ROUTE_STATUS_STYLES: Record<RouteStatus, string> = {
  DRAFT: 'border-slate-200 bg-slate-100 text-slate-600',
  PLANNED: 'border-transparent bg-primary/10 text-primary',
  DISPATCHED: 'border-transparent bg-warning/15 text-amber-700',
  IN_PROGRESS: 'border-transparent bg-warning/15 text-amber-700',
  COMPLETED: 'border-transparent bg-success text-success-foreground',
  CANCELLED: 'border-transparent bg-danger/10 text-danger',
}

export const DISPATCH_STATUS_LABELS: Record<DispatchStatus, string> = {
  PENDING: 'Pendiente',
  SENT: 'Enviado',
  DELIVERED: 'Entregado',
  READ: 'Leído',
  FAILED: 'Falló',
}

/** En DRAFT/PLANNED se puede editar la composición de paradas y el chofer. */
export function isEditableRoute(status: RouteStatus): boolean {
  return status === 'DRAFT' || status === 'PLANNED'
}
