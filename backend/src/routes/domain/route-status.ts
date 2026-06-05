import { RouteStatus } from '@prisma/client'

/**
 * Máquina de estados de la ruta.
 *   DRAFT → PLANNED → DISPATCHED → IN_PROGRESS → COMPLETED
 *   (cualquier estado no terminal) → CANCELLED
 */
const TRANSITIONS: Record<RouteStatus, RouteStatus[]> = {
  [RouteStatus.DRAFT]: [RouteStatus.PLANNED, RouteStatus.CANCELLED],
  [RouteStatus.PLANNED]: [RouteStatus.DISPATCHED, RouteStatus.DRAFT, RouteStatus.CANCELLED],
  [RouteStatus.DISPATCHED]: [RouteStatus.IN_PROGRESS, RouteStatus.CANCELLED],
  [RouteStatus.IN_PROGRESS]: [RouteStatus.COMPLETED, RouteStatus.CANCELLED],
  [RouteStatus.COMPLETED]: [],
  [RouteStatus.CANCELLED]: [],
}

export function canTransitionRoute(from: RouteStatus, to: RouteStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

/** En DRAFT/PLANNED se puede editar la composición de paradas. */
export function isEditableRoute(status: RouteStatus): boolean {
  return status === RouteStatus.DRAFT || status === RouteStatus.PLANNED
}
