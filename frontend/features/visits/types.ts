export type VisitType = 'REGULAR' | 'EXTRAORDINARY'

export type ExtraordinaryReason =
  | 'EMERGENCY'
  | 'ANTIBIOTIC_THERAPY'
  | 'SPECIAL_FOLLOWUP'
  | 'WOUND_CARE'

export type VisitModality = 'HOME' | 'CLINIC' | 'TELEHEALTH'

export type VisitStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'EN_ROUTE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED'

/** Paciente embebido en la respuesta de visita. */
export interface VisitPatient {
  id: string
  mrn: string
  firstName: string
  lastName: string
  status: string
  category: { code: string; name: string } | null
}

export interface VisitAssignment {
  id: string
  specialty: string
  isLead: boolean
  user: { id: string; fullName: string; specialty: string | null }
}

export interface Visit {
  id: string
  patientId: string
  type: VisitType
  reason: ExtraordinaryReason | null
  modality: VisitModality
  status: VisitStatus
  scheduledDate: string
  durationMin: number | null
  checkInAt: string | null
  completedAt: string | null
  cancelReason: string | null
  outcome: 'COMPLETED' | 'PATIENT_NOT_HOME' | 'OUT_OF_TIME' | 'REFUSED' | null
  patient: VisitPatient
  assignments: VisitAssignment[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** Resultado mínimo del buscador de pacientes (alta de visita). */
export interface PatientOption {
  id: string
  mrn: string
  firstName: string
  lastName: string
}
