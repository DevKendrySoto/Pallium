import { PatientStatus } from '@prisma/client'

/**
 * Máquina de estados del paciente. El paciente se crea ACTIVO directamente.
 * Transiciones permitidas:
 *   ACTIVE ⇄ PASSIVE
 *   ACTIVE | PASSIVE → DECEASED (terminal)
 *
 * Las visitas extraordinarias NO cambian el estado (se modelan aparte).
 */
const TRANSITIONS: Record<PatientStatus, PatientStatus[]> = {
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
