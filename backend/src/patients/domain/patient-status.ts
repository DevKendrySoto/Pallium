import { PatientStatus } from '@prisma/client'

/**
 * Máquina de estados del paciente. Transiciones permitidas:
 *   PENDING_APPROVAL → ACTIVE
 *   ACTIVE ⇄ PASSIVE
 *   ACTIVE | PASSIVE → DECEASED (terminal)
 *
 * Las visitas extraordinarias NO cambian el estado (se modelan aparte).
 */
const TRANSITIONS: Record<PatientStatus, PatientStatus[]> = {
  [PatientStatus.PENDING_APPROVAL]: [PatientStatus.ACTIVE],
  [PatientStatus.ACTIVE]: [PatientStatus.PASSIVE, PatientStatus.DECEASED],
  [PatientStatus.PASSIVE]: [PatientStatus.ACTIVE, PatientStatus.DECEASED],
  [PatientStatus.DECEASED]: [], // terminal
}

export function canTransition(from: PatientStatus, to: PatientStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export function assertableTransitions(from: PatientStatus): PatientStatus[] {
  return TRANSITIONS[from]
}
