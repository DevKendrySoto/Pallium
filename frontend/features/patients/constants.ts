import type { IdentificationType, PatientStatus, Sex } from '@/types/patient'

export const STATUS_LABELS: Record<PatientStatus, string> = {
  ACTIVE: 'Activo',
  PASSIVE: 'Pasivo',
  DECEASED: 'Deceso',
}

export const SEX_LABELS: Record<Sex, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  OTHER: 'Otro',
  UNKNOWN: 'Sin especificar',
}

export const ID_TYPE_LABELS: Record<IdentificationType, string> = {
  CEDULA: 'Cédula',
  PASSPORT: 'Pasaporte',
  BIRTH_CERTIFICATE: 'Acta de nacimiento',
  FOREIGN_ID: 'ID extranjero',
  OTHER: 'Otro',
}

/** Transiciones de estado permitidas (espejo de la máquina del backend). */
export const ALLOWED_TRANSITIONS: Record<PatientStatus, PatientStatus[]> = {
  ACTIVE: ['PASSIVE', 'DECEASED'],
  PASSIVE: ['ACTIVE', 'DECEASED'],
  DECEASED: [],
}
