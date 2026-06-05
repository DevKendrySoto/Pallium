export type AllergyType = 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER'
export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE'
export type HistoryCategory = 'PERSONAL' | 'SURGICAL' | 'FAMILY' | 'OBSTETRIC'
export type HabitType = 'TOBACCO' | 'ALCOHOL' | 'DRUGS' | 'OTHER'
export type HabitStatus = 'NEVER' | 'ACTIVE' | 'FORMER'

export interface Allergy {
  id: string
  substance: string
  type: AllergyType
  reaction: string | null
  severity: AllergySeverity
  isActive: boolean
  createdAt: string
}

export interface MedicalHistory {
  id: string
  category: HistoryCategory
  description: string
  year: number | null
  createdAt: string
}

export interface Habit {
  id: string
  type: HabitType
  status: HabitStatus
  detail: string | null
  quantity: string | null
}

export interface AdvanceDirective {
  id: string
  dnr: boolean
  preferredPlaceOfCare: string | null
  lifeSupportPreferences: string | null
  proxyName: string | null
  proxyPhone: string | null
  signedAt: string | null
}
