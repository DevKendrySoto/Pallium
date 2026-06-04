import type {
  ExtraordinaryReason,
  VisitModality,
  VisitStatus,
  VisitType,
} from './types'

export const TYPE_LABELS: Record<VisitType, string> = {
  REGULAR: 'Regular',
  EXTRAORDINARY: 'Extraordinaria',
}

export const REASON_LABELS: Record<ExtraordinaryReason, string> = {
  EMERGENCY: 'Emergencia',
  ANTIBIOTIC_THERAPY: 'Antibioterapia',
  SPECIAL_FOLLOWUP: 'Seguimiento especial',
  WOUND_CARE: 'Curación',
}

export const MODALITY_LABELS: Record<VisitModality, string> = {
  HOME: 'Domiciliaria',
  CLINIC: 'En sede',
  TELEHEALTH: 'Teleconsulta',
}

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  SCHEDULED: 'Agendada',
  CONFIRMED: 'Confirmada',
  EN_ROUTE: 'En ruta',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Realizada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
  RESCHEDULED: 'Reagendada',
}

/** Estados desde los que aún se puede completar o cancelar una visita. */
export const ACTIONABLE_STATUSES: VisitStatus[] = [
  'SCHEDULED',
  'CONFIRMED',
  'EN_ROUTE',
  'IN_PROGRESS',
]
