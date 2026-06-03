/**
 * Reglas de cadencia operativa.
 * Las visitas REGULARES marcan el reloj de 30 días; las EXTRAORDINARIAS no.
 */
export const CADENCE_DAYS = 30

/** Ventana (días) antes del vencimiento para avisar con antelación. */
export const CADENCE_WARNING_DAYS = 7

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Próximo vencimiento de visita regular a partir de la última realizada. */
export function computeNextRegularDue(lastRegularVisitAt: Date): Date {
  return addDays(lastRegularVisitAt, CADENCE_DAYS)
}

export type CadenceState = 'OK' | 'DUE_SOON' | 'OVERDUE'

/** Clasifica la situación de cadencia de un paciente respecto a `now`. */
export function classifyCadence(nextDue: Date | null, now: Date): CadenceState {
  if (!nextDue) return 'OK'
  if (nextDue < now) return 'OVERDUE'
  if (nextDue <= addDays(now, CADENCE_WARNING_DAYS)) return 'DUE_SOON'
  return 'OK'
}
