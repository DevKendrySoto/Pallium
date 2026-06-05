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

// ---- Fase 2 ----

export type FamilyRole = 'CAREGIVER' | 'DEPENDENT' | 'SUPPORT' | 'NONE'

export interface Caregiver {
  id: string
  fullName: string
  relationship: string | null
  phone: string | null
  isPrimary: boolean
  isCohabitant: boolean
  burdenFlag: boolean
}

export interface FamilyMember {
  id: string
  name: string
  relationship: string
  age: number | null
  alive: boolean
  role: FamilyRole
  notes: string | null
}

export interface SocialProfile {
  id: string
  housingType: string | null
  accessibility: string | null
  basicServices: string | null
  incomeLevel: string | null
  occupation: string | null
  insurance: string | null
  dependents: number | null
  notes: string | null
}

export interface Immunization {
  id: string
  vaccine: string
  date: string
  dose: string | null
  lot: string | null
  notes: string | null
}
