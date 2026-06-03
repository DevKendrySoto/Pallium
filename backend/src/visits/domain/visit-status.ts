import { VisitStatus } from '@prisma/client'

/**
 * Máquina de estados de la visita.
 *   SCHEDULED → CONFIRMED → EN_ROUTE → IN_PROGRESS → COMPLETED
 *   (cualquier estado activo) → CANCELLED / NO_SHOW / RESCHEDULED
 * COMPLETED, CANCELLED y RESCHEDULED son terminales.
 */
const TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  [VisitStatus.SCHEDULED]: [
    VisitStatus.CONFIRMED,
    VisitStatus.EN_ROUTE,
    VisitStatus.IN_PROGRESS,
    VisitStatus.COMPLETED,
    VisitStatus.CANCELLED,
    VisitStatus.NO_SHOW,
    VisitStatus.RESCHEDULED,
  ],
  [VisitStatus.CONFIRMED]: [
    VisitStatus.EN_ROUTE,
    VisitStatus.IN_PROGRESS,
    VisitStatus.COMPLETED,
    VisitStatus.CANCELLED,
    VisitStatus.NO_SHOW,
    VisitStatus.RESCHEDULED,
  ],
  [VisitStatus.EN_ROUTE]: [
    VisitStatus.IN_PROGRESS,
    VisitStatus.COMPLETED,
    VisitStatus.NO_SHOW,
    VisitStatus.CANCELLED,
  ],
  [VisitStatus.IN_PROGRESS]: [VisitStatus.COMPLETED, VisitStatus.CANCELLED],
  [VisitStatus.COMPLETED]: [],
  [VisitStatus.CANCELLED]: [],
  [VisitStatus.NO_SHOW]: [VisitStatus.RESCHEDULED],
  [VisitStatus.RESCHEDULED]: [],
}

export function canTransitionVisit(from: VisitStatus, to: VisitStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export function isTerminalVisitStatus(status: VisitStatus): boolean {
  return TRANSITIONS[status].length === 0
}
