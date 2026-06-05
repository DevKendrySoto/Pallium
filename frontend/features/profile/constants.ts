import type {
  AllergySeverity,
  AllergyType,
  HabitStatus,
  HabitType,
  HistoryCategory,
} from '@/types/profile'

export const ALLERGY_TYPE_LABELS: Record<AllergyType, string> = {
  MEDICATION: 'Medicamento',
  FOOD: 'Alimento',
  ENVIRONMENTAL: 'Ambiental',
  OTHER: 'Otro',
}

export const ALLERGY_SEVERITY_LABELS: Record<AllergySeverity, string> = {
  MILD: 'Leve',
  MODERATE: 'Moderada',
  SEVERE: 'Severa',
}

export const HISTORY_CATEGORY_LABELS: Record<HistoryCategory, string> = {
  PERSONAL: 'Personal',
  SURGICAL: 'Quirúrgico',
  FAMILY: 'Familiar',
  OBSTETRIC: 'Obstétrico',
}

export const HABIT_TYPE_LABELS: Record<HabitType, string> = {
  TOBACCO: 'Tabaco',
  ALCOHOL: 'Alcohol',
  DRUGS: 'Drogas',
  OTHER: 'Otro',
}

export const HABIT_STATUS_LABELS: Record<HabitStatus, string> = {
  NEVER: 'Nunca',
  ACTIVE: 'Activo',
  FORMER: 'Exconsumidor',
}
